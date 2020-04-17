require('dotenv').config()
const streamBatchPromise = require('stream-batch-promise')
const getProgressBar = require('./lib/progress')
const log = require('./lib/logger')
const timebox = require('./lib/timebox')
const { TimeoutError } = require('./lib/errors')
const fetchData = require('./fetch-data')
const memwatch = require('@airbnb/node-memwatch')
const asyncPool = require('tiny-async-pool')

const {
  BATCH_SIZE,
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  OFFSET,
  TABLE_MAIN_CHARITY,
  TABLE_SOCIAL,
  REQUEST_CONCURRENCY,
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

let hd = new memwatch.HeapDiff()
let heapDiff
memwatch.on('stats', function(stats) {
  heapDiff = hd.end()
  hd = new memwatch.HeapDiff()
})
process.on('exit', (code) => {
  log.info(`About to exit with code: ${code}`)
  log.info('Heap diff:')
  log.info(JSON.stringify(heapDiff, null, 2))
})

const update = async arr => {
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
    ))
  const allQueries = [...updateQueries, ...insertQueries]
  if (allQueries.length === 0) {
    return
  }
  const transaction = knex.transaction(trx => {
    return Promise.all(allQueries.map(x => x.transacting(trx)))
      .then(trx.commit)
      .catch(trx.rollback)
  })
  try {
    await timebox(transaction)
  } catch (e) {
    if (e instanceof TimeoutError) {
      log.error('Update operation timed out: ', e.message)
      return null
    } else {
      throw e
    }
  }
}

const batchHandler = (items, counter) => {
  return new Promise(async (resolve, reject) => {
    try {
      const dataArr = await asyncPool(
        parseInt(REQUEST_CONCURRENCY),
        items,
        fetchData
      )
      await update(dataArr.filter(x => x)) // todo: update website even if no data returned
      PROGRESS_BAR.update(counter)
      resolve()
    } catch(e) {
      reject(e)
    }
  })
}

const f = async () => {
  try {
    log.info(`Cleaning url data in '${TABLE_MAIN_CHARITY}' and inserting social handles into '${TABLE_SOCIAL}'`)

    const countQuery = knex(TABLE_MAIN_CHARITY)
      .leftJoin(TABLE_SOCIAL, `${TABLE_MAIN_CHARITY}.regno`, '=', `${TABLE_SOCIAL}.regno`)
      .whereNull(`${TABLE_SOCIAL}.twitter`)
      .whereNull(`${TABLE_SOCIAL}.facebook`)
      .whereNotNull(`${TABLE_MAIN_CHARITY}.web`)
      .count('*', { as: 'numCharities' })

    const { numCharities } = (await countQuery)[0]

    const charitiesToUpdate = knex
      .select({
        id: `${TABLE_MAIN_CHARITY}.regno`,
        url: `${TABLE_MAIN_CHARITY}.web`,
      })
      .from(TABLE_MAIN_CHARITY)
      .leftJoin(TABLE_SOCIAL, `${TABLE_MAIN_CHARITY}.regno`, '=', `${TABLE_SOCIAL}.regno`)
      .orderBy(`${TABLE_MAIN_CHARITY}.regno`, 'asc')
      .offset(OFFSET)
      .whereNull(`${TABLE_SOCIAL}.twitter`)
      .whereNull(`${TABLE_SOCIAL}.facebook`)
      .whereNotNull(`${TABLE_MAIN_CHARITY}.web`)

    const queryStream = charitiesToUpdate.stream()
    queryStream.on('error', err => {
      log.error('Query stream error')
      log.error(err)
    })

    PROGRESS_BAR.start(numCharities - OFFSET, 0)
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
