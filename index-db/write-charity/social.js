require('dotenv').config()
const streamBatchPromise = require('stream-batch-promise')
const getProgressBar = require('../lib/progress')
const log = require('../lib/logger')
const knex = require('../knex-connection')

const {
  BATCH_SIZE,
  TABLE_CHARITY_JSON,
  TABLE_SOCIAL,
} = process.env

const PROGRESS_BAR = getProgressBar('Progress')

const parser = x => {
  if (!x.chcId) return null

  return {
    chcId: x.chcId,
    image: JSON.stringify(x.image),
    social: JSON.stringify(x.social),
  }
}

const update = async arr => {
  const updateQueries = arr
    .map(({ chcId, image, social }) => (
      knex(TABLE_CHARITY_JSON)
        .where('chcId', '=', chcId)
        .update({ image, social }) // todo: create social column
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
    log.info(`Persisting data from '${TABLE_SOCIAL}' to '${TABLE_CHARITY_JSON}'`)

    const countQuery = knex(TABLE_SOCIAL)
      .count('*', { as: 'numCharities' })

    const { numCharities } = (await countQuery)[0]

    const query = knex
      .select([
        `s.regno as chcId`,
        knex.raw(`JSON_OBJECT(
          'logo', JSON_OBJECT(
            'small', JSON_OBJECT(
              'bucket', s.avatar_bucket,
              'path', s.avatar_small
            ),
            'medium', JSON_OBJECT(
              'bucket', s.avatar_bucket,
              'path', s.avatar_medium
            ),
            'large', JSON_OBJECT(
              'bucket', s.avatar_bucket,
              'path', s.avatar_large
            )
          )
        ) as image`),
        knex.raw(`JSON_OBJECT(
          'twitter', twitter,
          'facebook', facebook
        ) as social`),
      ])
      .from(`${TABLE_SOCIAL} as s`)

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
