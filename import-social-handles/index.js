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
  TABLE_SOCIAL,
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
        .filter(x => x.url !== x.cleanUrl)
        .map(({
          id,
          url,
          cleanUrl,
          twitter,
          facebook,
        }) => (
          knex(TABLE_MAIN_CHARITY)
            .where('regno', '=', id)
            .update({ web: cleanUrl })
            .transacting(trx)
        ))
      const insertQueries = arr
        .filter(({ twitter, facebook }) => twitter || facebook)
        .map(({ id, twitter, facebook }) => (
          knex(TABLE_SOCIAL)
            .insert({
              regno: id,
              twitter,
              facebook,
            })
            .transacting(trx)
        ))
        return Promise.all([...updateQueries, ...insertQueries])
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
      const dataArr = await Promise.all(items.map(({ regno, web }) => fetchData({ id: regno, url: web })))
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
      .leftJoin(TABLE_SOCIAL, `${TABLE_MAIN_CHARITY}.regno`, '=', `${TABLE_SOCIAL}.regno`)
      .where({
        [`${TABLE_SOCIAL}.twitter`]: null,
        [`${TABLE_SOCIAL}.facebook`]: null,
      })
      .count('*', { as: 'numCharities' })

    const { numCharities } = (await countQuery)[0]

    PROGRESS_BAR.start(numCharities, 0)

    const charitiesToUpdate = knex
      .select(
        `${TABLE_MAIN_CHARITY}.regno`,
        `${TABLE_MAIN_CHARITY}.web`,
      )
      .from(TABLE_MAIN_CHARITY)
      .leftJoin(TABLE_SOCIAL, `${TABLE_MAIN_CHARITY}.regno`, '=', `${TABLE_SOCIAL}.regno`)
      .where({
        [`${TABLE_SOCIAL}.twitter`]: null,
        [`${TABLE_SOCIAL}.facebook`]: null,
      })

    log.info(`Cleaning url data in '${TABLE_MAIN_CHARITY}' and inserting social handles into '${TABLE_SOCIAL}'`)

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
