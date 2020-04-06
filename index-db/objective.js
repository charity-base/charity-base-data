require('dotenv').config()
const streamBatchPromise = require('stream-batch-promise')
const getProgressBar = require('./lib/progress')
const log = require('./lib/logger')
const knex = require('./knex-connection')

const {
  BATCH_SIZE,
  TABLE_CHARITY_JSON,
  TABLE_MAIN_CHARITY,
  TABLE_OBJECTS,
} = process.env

const MAX_OBJECTIVE_LENGTH = 10000

const PROGRESS_BAR = getProgressBar('Progress')

const parser = x => {
  if (!x.chcId || !x.objectives) return null

  return {
    chcId: x.chcId,
    objectives: x.objectives.trim(),
  }
}

const update = async arr => {
  const updateQueries = arr
    .map(({ chcId, objectives }) => (
      knex(TABLE_CHARITY_JSON)
        .where('chcId', '=', chcId)
        .update({ objectives })
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
    log.info(`Persisting data from '${TABLE_OBJECTS}' to '${TABLE_CHARITY_JSON}'`)

    const countQuery = knex(`${TABLE_OBJECTS} as o`)
      .countDistinct('o.regno as numCharities')
      .innerJoin(`${TABLE_MAIN_CHARITY} as mc`, 'mc.regno', '=', 'o.regno')
      .where('o.subno', '=', '0')

    const { numCharities } = (await countQuery)[0]


    await knex.raw(`SET SESSION group_concat_max_len = ${MAX_OBJECTIVE_LENGTH};`)

    const query = knex
      .select([
        `o.regno as chcId`,
        knex.raw(`REPLACE(
          GROUP_CONCAT(
            o.object ORDER BY o.regno, o.seqno SEPARATOR ''
          ),
          '0001',
          ''
        ) as objectives`),
      ])
      .from(`${TABLE_OBJECTS} as o`)
      .innerJoin(`${TABLE_MAIN_CHARITY} as mc`, 'mc.regno', '=', 'o.regno')
      .groupBy('o.regno')

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
