require('dotenv').config()
const streamBatchPromise = require('stream-batch-promise')
const getProgressBar = require('./lib/progress')
const log = require('./lib/logger')
const timebox = require('./lib/timebox')
const { TimeoutError } = require('./lib/errors')
const fetchData = require('./fetch-data')
const uploadData = require('./upload-data')
const memwatch = require('@airbnb/node-memwatch')
const asyncPool = require('tiny-async-pool')

const {
  BATCH_SIZE,
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  OFFSET,
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
  if (arr.length === 0) {
    return
  }
  const queries = arr
    .map(({
      id,
      size,
      bucket,
      key,
    }) => (
      knex(TABLE_SOCIAL)
        .where('regno', '=', id)
        .update({
          avatar_bucket: bucket,
          [`avatar_${size}`]: key,
        })
    ))
  const transaction = knex.transaction(trx => {
    return Promise.all(queries.map(x => x.transacting(trx)))
      .then(trx.commit)
      .catch(trx.rollback)
  })
  try {
    await timebox(transaction, 10000)
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
  const sizedItems = items.reduce((agg, { id, twitter, facebook }) => [
    ...agg,
    ...['small', 'medium', 'large'].map(size => ({
      id,
      twitter,
      facebook,
      size,
    }))
  ], [])
  return new Promise(async (resolve, reject) => {
    try {
      const dataArr = await asyncPool(
        parseInt(REQUEST_CONCURRENCY),
        sizedItems,
        fetchData
      )
      const paths = await asyncPool(
        parseInt(REQUEST_CONCURRENCY),
        dataArr.filter(x => x),
        uploadData
      )
      await update(paths.filter(x => x))
      PROGRESS_BAR.update(counter)
      resolve()
    } catch(e) {
      reject(e)
    }
  })
}

const f = async () => {
  try {
    log.info(`Fetching avatars, persisting to S3 and saving paths to table '${TABLE_SOCIAL}'`)
    
    const countQuery = knex(TABLE_SOCIAL)
      .whereNull(`${TABLE_SOCIAL}.avatar_small`)
      .count('*', { as: 'numCharities' })

    const { numCharities } = (await countQuery)[0]

    const charitiesToUpdate = knex
      .select({
        id: `${TABLE_SOCIAL}.regno`,
        twitter: `${TABLE_SOCIAL}.twitter`,
        facebook: `${TABLE_SOCIAL}.facebook`,
      })
      .from(TABLE_SOCIAL)
      .orderBy(`${TABLE_SOCIAL}.regno`, 'asc')
      .offset(OFFSET)
      .whereNull(`${TABLE_SOCIAL}.avatar_small`)

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
