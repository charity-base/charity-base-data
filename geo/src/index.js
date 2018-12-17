const getCharityGeos = require('./stream-processor')
const { db } = require('../config')
const { log, connectToDb, Charity, getProgressBar } = require('./helpers')

const NUM_CHARITIES_ESTIMATE = 170000

const geoCode = () => {
  let progressBar

  return connectToDb(db, { useNewUrlParser: true })
  .then(() => {
    progressBar = getProgressBar('Geocoding charities')
    progressBar.start(NUM_CHARITIES_ESTIMATE, 0)
    return getCharityGeos(
      Charity,
      progressBar.update.bind(progressBar)
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

geoCode()
