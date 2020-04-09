require('dotenv').config()
const streamBatchPromise = require('stream-batch-promise')
const getProgressBar = require('./lib/progress')
const log = require('./lib/logger')
const fs = require('fs')
const csv = require('csv-parser')

const {
  BATCH_SIZE,
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  MALLET_DATA_DIR,
  MALLET_NUM_TOPICS,
  TABLE_CHARITY_TOPIC,
  TABLE_TOPIC,
} = process.env

const NUM_TOKENS = 20 // number of words each topic is defined by
const FILENAME_TOPIC = 'topics.tsv'
const FILENAME_CHARITY_TOPIC = 'doc_topics.tsv'
const EPOCH = Date.now()

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

const stamp = id => `${EPOCH}-${id}`

const insertCharityTopics = arr => {
  return knex.transaction(trx => {
    const insertQueries = arr
      .reduce((agg, { id, regno, ...topics }) => {
        return [
          ...agg,
          ...Object.keys(topics).map(topicId => {
            return knex(TABLE_CHARITY_TOPIC)
              .insert({ regno, topic_id: topicId, score: topics[topicId] })
              .transacting(trx)
          })
        ]
      }, [])
    return Promise.all(insertQueries)
      .then(trx.commit)
      .catch(trx.rollback)
  })
}

const countWrapper = batchHandler => (items, counter) => {
  return new Promise(async (resolve, reject) => {
    try {
      await batchHandler(items)
      PROGRESS_BAR.update(counter*parseInt(MALLET_NUM_TOPICS))
      resolve()
    } catch(e) {
      reject(e)
    }
  })
}

const insertTopics = arr => {
  return knex.transaction(trx => {
    const insertQueries = arr
      .map(({ id, occurrence, ...tokens }) => {
        return knex(TABLE_TOPIC)
          .insert({ id, tokens: Object.values(tokens).join(' ') })
          .transacting(trx)
      })
    return Promise.all(insertQueries)
      .then(trx.commit)    
      .catch(trx.rollback)
  })
}

const filePath = fileName => {
  return [__dirname, MALLET_DATA_DIR, fileName].join('/')
}

const f = async () => {
  try {

    log.info(`Inserting topics from file '${FILENAME_TOPIC}' into table '${TABLE_TOPIC}'`)

    const readTopic = fs.createReadStream(filePath(FILENAME_TOPIC)).on('error', e => { throw e })
    const topicTsvToJson = csv({
      separator: '\t',
      headers: ['id', 'occurrence', ...[...new Array(NUM_TOKENS)].map((_, i) => `token_${i}`)],
      mapValues: ({ header, value }) => {
        return header === 'id' ? stamp(value) : value
      }
    }).on('error', e => { throw e })

    await streamBatchPromise(
      readTopic.pipe(topicTsvToJson),
      insertTopics,
      {
        batchSize: parseInt(MALLET_NUM_TOPICS),
      }
    )

    log.info(`Inserting charity topics from file '${FILENAME_CHARITY_TOPIC}' into table '${TABLE_CHARITY_TOPIC}'`)
    
    let numCharities = 0
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath(FILENAME_CHARITY_TOPIC))
        .on('error', reject)
        .on('data', chunk => {
          for (i=0; i < chunk.length; ++i) {
            if (chunk[i] == 10) {
              numCharities++
            }
          }
        })
        .on('end', () => resolve(numCharities))
    })

    PROGRESS_BAR.start(numCharities*parseInt(MALLET_NUM_TOPICS), 0)

    const readStream = fs.createReadStream(filePath(FILENAME_CHARITY_TOPIC)).on('error', e => { throw e })

    const tsvToJson = csv({
      separator: '\t',
      headers: ['id', 'regno', ...[...new Array(parseInt(MALLET_NUM_TOPICS))].map((_, i) => stamp(i))],
      mapValues: ({ header, index, value }) => {
        return index > 1 ? Math.round(parseFloat(value)*Math.pow(10, 3))/Math.pow(10, 3) : value
      }
    }).on('error', e => { throw e })

    await streamBatchPromise(
      readStream.pipe(tsvToJson),
      countWrapper(insertCharityTopics),
      {
        batchSize: parseInt(BATCH_SIZE),
      }
    )
    PROGRESS_BAR.stop()
    await knex.destroy()
  } catch(e) {
    log.error(e)
    process.exit()
  }
}

f()
