require('dotenv').config()
const streamBatchPromise = require('stream-batch-promise')
const getProgressBar = require('../lib/progress')
const log = require('../lib/logger')
const knex = require('../knex-connection')

const {
  BATCH_SIZE,
  TABLE_CHARITY_JSON,
  TABLE_CHARITY_TOPIC,
  TABLE_TOPIC,
} = process.env

const MIN_SCORE = 0.25

const PROGRESS_BAR = getProgressBar('Progress')

const parser = x => {
  if (!x.chcId || !x.topics) return null

  // sort by descending score
  const topics = x.topics.sort((a, b) => (b.score - a.score))

  return {
    chcId: x.chcId,
    topics: JSON.stringify(topics),
  }
}

const update = async arr => {
  const updateQueries = arr
    .map(({ chcId, topics }) => (
      knex(TABLE_CHARITY_JSON)
        .where('chcId', '=', chcId)
        .update({ topics })
    ))
  if (updateQueries.length === 0) {
    return
  }
  const transaction = knex.transaction(trx => {
    return Promise.all(updateQueries.map(x => x.transacting(trx)))
      .then(trx.commit)
      .catch(trx.rollback)
  })
  return transaction
}

const batchHandler = (items, counter) => {
  return new Promise(async (resolve, reject) => {
    try {
      const docs = items.map(parser).filter(x => x)
      await update(docs)
      PROGRESS_BAR.update(counter)
      resolve()
    } catch(e) {
      reject(e)
    }
  })
}

const f = async () => {
  try {
    log.info(`Persisting data from '${TABLE_CHARITY_TOPIC}' & '${TABLE_TOPIC}' to '${TABLE_CHARITY_JSON}'`)

    const countQuery = knex(TABLE_CHARITY_TOPIC)
      .countDistinct('regno as numCharities')
      .where('score', '>=', MIN_SCORE)

    const { numCharities } = (await countQuery)[0]

    const epoch = Date.now()

    const query = knex
      .select([
        'ct.regno as chcId',
        knex.raw(`JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', CONCAT_WS(
              '-',
              ${epoch},
              ct.topic_id
            ),
            'name', t.tokens,
            'score', ROUND(ct.score, 3)
          )
        ) as topics`),
      ])
      .from(`${TABLE_CHARITY_TOPIC} as ct`)
      .innerJoin(`${TABLE_TOPIC} as t`, 't.id', '=', 'ct.topic_id')
      .where('ct.score', '>=', MIN_SCORE)
      .groupBy('ct.regno')

    const queryStream = query.stream()
    queryStream.on('error', err => {
      log.error('Query stream error')
      log.error(err)
      throw err
    })

    PROGRESS_BAR.start(numCharities, 0)
    const total = await streamBatchPromise(
      queryStream,
      batchHandler,
      {
        batchSize: BATCH_SIZE,
      }
    )
    PROGRESS_BAR.update(total)
    PROGRESS_BAR.stop()
    log.info(`Successfully streamed through ${total} items`)
    await knex.destroy()
  } catch(e) {
    log.error(e)
    process.exit()
  }
}

f()
