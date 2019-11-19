const batchHandler = require('./batch-handler')
const streamBatchPromise = require('stream-batch-promise')
const { db } = require('../config')
const { log, connectToDb, Charity, getProgressBar } = require('./helpers')

const QUERY = {
  // 'ids.GB-CHC': 200051,
  'website': { '$ne': null},
  // 'meta.0': { '$exists': true },
  // 'twitterHandle.0': { '$exists': true },
  'contact.social.0': { '$exists': false },
}

const unleak = x => (' ' + x).substr(1)

const parser = x => ({
  _id: unleak(x._doc._id),
  website: unleak(x._doc.website),
})

async function scrape() {
  let progressBar

  const connection = await connectToDb(db, { useNewUrlParser: true })
  log.info(`Connected to DB ${db.name}`)

  const totalCount = await Charity.countDocuments(QUERY).exec()
  console.log(`Streaming through ${totalCount} charities`)

  progressBar = getProgressBar('Scraping websites')
  progressBar.start(totalCount, 0)
  
  try {
    await streamBatchPromise(
      Charity.find(QUERY, { _id: 1, website: 1 }).cursor(),
      parser,
      (parsedItems, counter) => {
        progressBar.update.bind(progressBar)(counter)
        // log.info(`Used heap memory: ${Math.round(100*process.memoryUsage().heapUsed / 1024 / 1024)/100}MB`)
        // log.info(`COUNTER ${counter}/${totalCount}`)
        // const used = process.memoryUsage()
        // for (let key in used) {
        //   log.info(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`)
        // }
        return batchHandler(parsedItems, Charity)
      },
      { batchSize: 20 },
    )
  } catch (e) {
    log.error('Failed to stream batch promise')
    log.error(e)
  }


  progressBar.update(totalCount)
  progressBar.stop()
  log.info(`Streamed through ${totalCount} charities`)
  process.exit(0)
}

try {
  scrape()
}
catch (e) {
  log.error(e)
  process.exit(1)
}