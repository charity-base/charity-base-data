const fsPromises = require('fs').promises
const { setGrantRecipients, writeGrantDescriptions, setGrantTopics, pushGrantsToCharities } = require('./stream-processors')
const { db, classification } = require('../config')
const { importDir, trainTopics } = require('mallet-topics')
const { log, connectToDb, Grant, Charity, getProgressBar } = require('./helpers')

const NUM_GRANTS_ESTIMATE = 300000
const NUM_CHARITY_GRANTS_ESTIMATE = 100000

const classifyGrantsToCharities = () => {
  let progressBar

  return connectToDb(db, { useNewUrlParser: true })
  .then(() => {
    progressBar = getProgressBar('Setting grant recipients')
    progressBar.start(NUM_GRANTS_ESTIMATE, 0)
    return setGrantRecipients(
      Grant,
      progressBar.update.bind(progressBar)
    )
  })
  .then(counter => {
    progressBar.update(NUM_GRANTS_ESTIMATE)
    progressBar.stop()
  })
  .then(() => fsPromises.mkdir(classification.inputDir))
  .then(() => {
    progressBar = getProgressBar('Writing grant descriptions')
    progressBar.start(NUM_CHARITY_GRANTS_ESTIMATE, 0)
    return writeGrantDescriptions(
      Grant,
      classification.inputDir,
      progressBar.update.bind(progressBar)
    )
  })
  .then(counter => {
    progressBar.update(NUM_CHARITY_GRANTS_ESTIMATE)
    progressBar.stop()
  })
  .then(() => {
    log.info(`Importing data into ${classification.importOpts.malletDataFile} - could take a minute...`)
    return importDir(
      classification.mallet,
      classification.inputDir,
      {
        ...classification.importOpts,
        onStdData: (stdType, msg) => log.info(msg.toString()),
      }
    )
  })
  .then(() => ({ malletDataFile: classification.importOpts.malletDataFile }))
  .then(({ malletDataFile }) => {
    log.info(`Training topics - could take a minute...`)
    return trainTopics(
      classification.mallet,
      malletDataFile,
      {
        ...classification.trainOpts,
        onStdData: (stdType, msg) => log.info(msg.toString()),
      }
    )
  })
  .then(({ docTopicsFile }) => {
    progressBar = getProgressBar('Setting grant topics')
    progressBar.start(NUM_CHARITY_GRANTS_ESTIMATE, 0)
    return setGrantTopics(
      Grant,
      docTopicsFile,
      progressBar.update.bind(progressBar)
    )
  })
  .then(counter => {
    progressBar.update(NUM_CHARITY_GRANTS_ESTIMATE)
    progressBar.stop()
  })
  .then(() => {
    progressBar = getProgressBar('Pushing grants to charities')
    progressBar.start(NUM_CHARITY_GRANTS_ESTIMATE, 0)
    return pushGrantsToCharities(
      Grant,
      Charity,
      progressBar.update.bind(progressBar)
    )
  })
  .then(counter => {
    progressBar.update(NUM_CHARITY_GRANTS_ESTIMATE)
    progressBar.stop()
  })
  .then(counter => {
    log.info(`Successfully classified & pushed ${counter} grants`)
    process.exit(0)
  })
  .catch(err => {
    log.error(err)
    process.exit(1)
  })
}

classifyGrantsToCharities()
