require('dotenv').config()
const streamBatchPromise = require('stream-batch-promise')
const getProgressBar = require('./lib/progress')
const log = require('./lib/logger')
const knex = require('./knex-connection')

const {
  BATCH_SIZE,
  TABLE_CHARITY_JSON,
  TABLE_FINANCIAL,
  TABLE_MAIN_CHARITY,
} = process.env

const PROGRESS_BAR = getProgressBar('Progress')

const parser = x => {
  if (!x.chcId || !x.finances) return null
  // Sort finances by descending financial year
  const finances = x.finances.sort((a, b) => new Date(b.financialYear.end) - new Date(a.financialYear.end))

  return {
    chcId: x.chcId,
    finances: JSON.stringify(finances)
  }
}

const update = async arr => {
  const updateQueries = arr
    .map(({ chcId, finances }) => (
      knex(TABLE_CHARITY_JSON)
        .where('chcId', '=', chcId)
        .update({ finances })
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
    log.info(`Persisting data from '${TABLE_FINANCIAL}' to '${TABLE_CHARITY_JSON}'`)

    const countQuery = knex(TABLE_FINANCIAL)
      .countDistinct('regno as numCharities')

    const { numCharities } = (await countQuery)[0]

    const query = knex
      .select([
        `regno as chcId`,
        knex.raw(`JSON_ARRAYAGG(
          JSON_OBJECT(
            'income', income,
            'spending', expend,
            'financialYear', JSON_OBJECT(
              'begin', fystart,
              'end', fyend
            )
          )
        ) as finances`),
      ])
      .from(TABLE_FINANCIAL)
      .groupBy('regno')

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
