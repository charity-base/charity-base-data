const batchHandler = require('./batch-handler')
const streamBatchPromise = require('stream-batch-promise')
const { db } = require('../config')
const { log, connectToDb, Charity, getProgressBar } = require('./helpers')

const NUM_CHARITIES_ESTIMATE = 95000

const QUERY = {
  website: { '$ne': null },
  'contact.social.0': { '$exists': false },
}

const SORT = {
  _id: -1
}

const parser = x => ({
  'id': x._doc.ids['GB-CHC'],
  'website': x._doc.website,
})

process.on('uncaughtException', (error) => {
  console.log('uncaughtException!')
  console.log(error)
})

const scrape = () => {
  let progressBar

  return connectToDb(db, { useNewUrlParser: true })
  .then(() => {
    progressBar = getProgressBar('Scraping charity website')
    progressBar.start(NUM_CHARITIES_ESTIMATE, 0)
    return streamBatchPromise(
      Charity.find(QUERY).sort(SORT).cursor(),
      parser,
      (parsedItems, counter) => {
        progressBar.update.bind(progressBar)(counter)
        return batchHandler(parsedItems, Charity)
      },
      { batchSize: 50 },
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

scrape()
