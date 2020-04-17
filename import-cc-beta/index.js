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
  return knex.transaction(trx => {
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
}

const batchHandler = async (items, counter) => {
  const dataArr = await Promise.all(items.map(x => fetchData(x.regno)))
  await update(dataArr.filter(x => x))
  PROGRESS_BAR.update(counter)
  return
}

const f = async () => {
  try {
    log.info(`Importing data into '${TABLE_MAIN_CHARITY}' from CC beta site`)

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

    const queryStream = charitiesToUpdate.stream()
    queryStream.on('error', err => {
      log.error('Query stream error')
      log.error(err)
      throw err
    })
    // queryStream.on('pause', () => log.info('pause'))
    // queryStream.on('resume', () => log.info('resume'))

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
