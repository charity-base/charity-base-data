require('dotenv').config()
const streamBatchPromise = require('stream-batch-promise')
const getProgressBar = require('../lib/progress')
const log = require('../lib/logger')
const knex = require('../knex-connection')

const {
  BATCH_SIZE,
  TABLE_CHARITY,
  TABLE_CHARITY_JSON,
  TABLE_POSTCODE_GEO,
} = process.env

const PROGRESS_BAR = getProgressBar('Progress')

const parser = x => {
  if (!x.chcId || !x.postcodeGeo) return null

  return {
    chcId: x.chcId,
    postcodeGeo: JSON.stringify(x.postcodeGeo),
  }
}

const update = async arr => {
  const updateQueries = arr
    .map(({ chcId, postcodeGeo }) => (
      knex(TABLE_CHARITY_JSON)
        .where('chcId', '=', chcId)
        .update({ postcodeGeo })
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
    log.info(`Persisting data from '${TABLE_POSTCODE_GEO}' to '${TABLE_CHARITY_JSON}'`)

    const countQuery = knex(`${TABLE_POSTCODE_GEO} as p`)
      .count('*', { as: 'numCharities' })
      .innerJoin(`${TABLE_CHARITY} as c`, 'c.postcode', '=', 'p.id')
      .where('c.subno', '=', '0')
      .where('c.orgtype', '=', 'R')

    const { numCharities } = (await countQuery)[0]

    const query = knex
      .select([
        'c.regno as chcId',
        'p.postcode_geo as postcodeGeo'
      ])
      .from(`${TABLE_POSTCODE_GEO} as p`)
      .innerJoin(`${TABLE_CHARITY} as c`, 'c.postcode', '=', 'p.id')
      .where('c.subno', '=', '0')
      .where('c.orgtype', '=', 'R')

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
