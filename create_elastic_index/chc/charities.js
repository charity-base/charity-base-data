const mongoose = require('mongoose')
const { chc } = require('charity-base-schema')
const streamBatchPromise = require('stream-batch-promise')
const esClient = require('../elastic-client')
const { db, elastic } = require('../config')
const { log, Charity, getProgressBar, bulkInsert } = require('../helpers')

const NUM_DOCS_ESTIMATE = 170000
const INDEX = elastic.indices.chc.charities
const INDEX_SETTINGS = {
  'index.mapping.coerce': true,
  'index.mapping.ignore_malformed': false,
  'index.requests.cache.enable': true,
}
const INDEX_MAPPINGS = {
  _doc: chc.charity,
}

async function esIndex() {
  let progressBar

  try {
    await mongoose.connect(
      `mongodb://${db.host}:${db.port}/${db.name}`,
      { useNewUrlParser: true },
    )
    log.info(`Successfully connected to mongodb '${db.name}'`)

    await esClient.indices.create({
      index: INDEX,
      body: {
        settings: INDEX_SETTINGS,
        mappings: INDEX_MAPPINGS,
      }
    })
    log.info(`Successfully created index '${INDEX}'`)

    progressBar = getProgressBar('Indexing documents')
    progressBar.start(NUM_DOCS_ESTIMATE, 0)

    const totalCount = await streamBatchPromise(
      Charity.find().cursor(),
      x => x.toJSON(),
      (parsedItems, counter) => {
        progressBar.update(counter)
        return bulkInsert(
          parsedItems,
          esClient,
          INDEX
        )
      },
      { batchSize: 1000 },
    )

    progressBar.update(NUM_DOCS_ESTIMATE)
    progressBar.stop()
    log.info(`Successfully indexed ${totalCount} documents`)

    mongoose.disconnect()
    log.info(`Successfully disconnected from mongodb '${db.name}'`)

  } catch(e) {
    log.error(`Failed to index '${INDEX}'`)
    log.error(e)
    process.exit(1)
  }

}

module.exports = esIndex
