const elasticsearch = require('elasticsearch')
const { elasticMapping } = require('charity-base-schema')
const insert = require('./stream-processor')
const { db, es } = require('../config')
const { log, connectToDb, Charity, getProgressBar } = require('./helpers')

const NUM_CHARITIES_ESTIMATE = 170000

es.client = new elasticsearch.Client({ host: es.host })

const createIndex = () => new Promise((resolve, reject) => {
  es.client.indices.create({
    index: es.index,
    body: {
      settings: {
        'index.mapping.ignore_malformed': false 
      },
      mappings: elasticMapping()
    }
  }, (err, res) => {
    if (err) {
      return reject(err)
    }
    return resolve(res)
  })
})


const esIndex = () => {
  let progressBar

  return connectToDb(db, { useNewUrlParser: true })
  .then(createIndex)
  .then(() => {
    progressBar = getProgressBar('Indexing charities')
    progressBar.start(NUM_CHARITIES_ESTIMATE, 0)
    return insert(
      Charity, 
      es.client, 
      es.index,
      progressBar.update.bind(progressBar),
    )
  })
  .then(counter => {
    progressBar.update(NUM_CHARITIES_ESTIMATE)
    progressBar.stop()
    log.info(`Streamed through ${counter} charities`)
    process.exit(0)
  })
  .catch(e => {
    log.error(e)
    process.exit(1)
  })
}

esIndex()
