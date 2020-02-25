require('dotenv').config()
const streamBatchPromise = require('stream-batch-promise')
const getProgressBar = require('./lib/progress')
const log = require('./lib/logger')
const fetchData = require('./fetch-data')

const {
  BATCH_SIZE,
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
        .map(({ id, activities, people }) => (
          knex(TABLE_MAIN_CHARITY)
            .where('regno', '=', id)
            .update({ activities, people: JSON.stringify(people) })
            .transacting(trx)
        ))
      return Promise.all(updateQueries)
        .then(trx.commit)    
        .catch(trx.rollback)
    })
    .then(updates => {
      resolve()
    })
    .catch(reject)
  })
}

const batchHandler = (items, counter) => {
  PROGRESS_BAR.update(counter)
  return new Promise(async (resolve, reject) => {
    try {
      const dataArr = await Promise.all(items.map(x => fetchData(x.regno)))
      await update(dataArr.filter(x => x))
      resolve()
    } catch(e) {
      reject(e)
    }
  })
}

const f = async () => {
  try {
    const countQuery = knex(TABLE_MAIN_CHARITY)
      .where({
        [`${TABLE_MAIN_CHARITY}.activities`]: null,
        [`${TABLE_MAIN_CHARITY}.people`]: null,
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
        [`${TABLE_MAIN_CHARITY}.activities`]: null,
        [`${TABLE_MAIN_CHARITY}.people`]: null,
      })

    log.info(`Importing data into '${TABLE_MAIN_CHARITY}' from CC beta site`)

    const total = await streamBatchPromise(
      charitiesToUpdate.stream(),
      batchHandler,
      {
        batchSize: BATCH_SIZE,
      }
    )
    PROGRESS_BAR.update(total)
    PROGRESS_BAR.stop()
    log.info(`Successfully searched for ${total} postcodes`)
    await knex.destroy()
  } catch(e) {
    log.error(e)
    process.exit()
  }
}

f()
