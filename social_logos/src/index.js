require('dotenv').config()
const batchHandler = require('./batch-handler')
const streamBatchPromise = require('stream-batch-promise')
const { db } = require('../config')
const { log, connectToDb, Charity, getProgressBar } = require('./helpers')

const QUERY = {
  'contact.social.0': { '$exists': true },
  'image.logo.small': { '$exists': false },
}

const parser = x => ({
  _id: x._doc._id,
  id: x._doc.ids['GB-CHC'],
  social: x._doc.contact.social,
})

async function f() {
  let progressBar

  const connection = await connectToDb(db, { useNewUrlParser: true })
  log.info(`Connected to DB ${db.name}`)

  const totalCount = await Charity.countDocuments(QUERY).exec()
  console.log(`Streaming through ${totalCount} charities`)

  progressBar = getProgressBar('Scraping websites')
  progressBar.start(totalCount, 0)
  
  await streamBatchPromise(
    Charity.find(QUERY, { _id: 1, ids: 1, 'contact.social': 1 }).cursor(),
    parser,
    (parsedItems, counter) => {
      // progressBar.update.bind(progressBar)(counter)
      // log.info(`Used heap memory: ${Math.round(100*process.memoryUsage().heapUsed / 1024 / 1024)/100}MB`)
      log.info(`COUNTER ${counter}/${totalCount}`)
      // const used = process.memoryUsage()
      // for (let key in used) {
      //   log.info(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`)
      // }
      return batchHandler(parsedItems, Charity)
    },
    { batchSize: 10 },
  )

  progressBar.update(totalCount)
  progressBar.stop()
  log.info(`Streamed through ${totalCount} charities`)
  process.exit(0)
}

try {
  f()
}
catch (e) {
  log.error(e)
  process.exit(1)
}
