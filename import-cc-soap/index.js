require('dotenv').config()
const streamBatchPromise = require('stream-batch-promise')
const asyncPool = require('tiny-async-pool')
const getProgressBar = require('./lib/progress')
const log = require('./lib/logger')
const fetchData = require('./fetch-data')

const {
  BATCH_SIZE,
  REQUEST_CONCURRENCY,
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  TABLE_MAIN_CHARITY,
} = process.env

const knex = require('knex')({
  client: 'mysql2',
  connection: {
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  },
  // debug: true,
})

const PROGRESS_BAR = getProgressBar('Progress')

const update = arr => {
  return new Promise((resolve, reject) => {
    knex.transaction(trx => {
      const updateQueries = arr
        .map(({ id, trusteeObjects }) => (
          knex(TABLE_MAIN_CHARITY)
            .where('regno', '=', id)
            .update({
              trustee_objects: JSON.stringify(trusteeObjects)
            })
            .transacting(trx)
        ))
      return Promise.all(updateQueries)
        .then(trx.commit)    
        .catch(trx.rollback)
    })
    .then(resolve)
    .catch(reject)
  })
}

const batchHandler = (items, counter) => {
  return new Promise(async (resolve, reject) => {
    try {
      const dataArr = await asyncPool(
        parseInt(REQUEST_CONCURRENCY),
        items.map(x => x.regno),
        fetchData
      )
      await update(dataArr.filter(x => x))
      PROGRESS_BAR.update(counter)
      resolve()
    } catch(e) {
      reject(e)
    }
  })
}

const f = async () => {
  try {
    log.info(`Importing data into '${TABLE_MAIN_CHARITY}' from CC SOAP API`)

    const countQuery = knex(TABLE_MAIN_CHARITY)
      .where({
        [`${TABLE_MAIN_CHARITY}.trustee_objects`]: null,
      })
      .count('regno', { as: 'numCharities' })

    const { numCharities } = (await countQuery)[0]

    PROGRESS_BAR.start(numCharities, 0)

    const charitiesToUpdate = knex
      .select(
        `${TABLE_MAIN_CHARITY}.regno`,
      )
      .from(TABLE_MAIN_CHARITY)
      .where({
        [`${TABLE_MAIN_CHARITY}.trustee_objects`]: null,
      })

    const total = await streamBatchPromise(
      charitiesToUpdate.stream(),
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
