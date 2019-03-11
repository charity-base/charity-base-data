require('dotenv').config()
const esClient = require('./elastic-client')
const { log } = require('./helpers')
const args = process.argv.slice(2)
const INDEX = args[0]

async function deleteIndex() {
  if (!INDEX) {
    return log.info('You must supply an index name from the command line')
  }
  try {
    await esClient.indices.delete({
      index: INDEX,
    })
    log.info(`Successfully deleted index '${INDEX}'`)
  } catch(e) {
    log.error(`Failed to delete index '${INDEX}'`)
    log.error(e)
  }
}

deleteIndex()
