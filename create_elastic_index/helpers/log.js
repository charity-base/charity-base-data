const bunyan = require('bunyan')
const progress = require('cli-progress')

const log = bunyan.createLogger({ name: 'main' })

const getProgressBar = message => {
  return new progress.Bar({
    format: `${message}: [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}`,
  }, progress.Presets.shades_classic)
}

module.exports = {
  log,
  getProgressBar,
}
