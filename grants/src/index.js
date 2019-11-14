const { setGrantRecipients, pushGrantsToCharities } = require('./stream-processors')
const { db } = require('../config')
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
    return counter
  })
  .then(counter => {
    log.info(`Successfully pushed ${counter} grants`)
    process.exit(0)
  })
  .catch(err => {
    log.error(err)
    process.exit(1)
  })
}

classifyGrantsToCharities()
