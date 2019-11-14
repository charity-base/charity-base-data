const bunyan = require('bunyan')
const progress = require('cli-progress')

const log = bunyan.createLogger({
  name: 'main',
  streams: [
    {
      level: 'debug',
      stream: process.stdout
    },
    // {
    //   level: 'info',
    //   type: 'rotating-file',
    //   path: `${LOGS_DIR}/main.log`,
    //   period: '1d',
    //   count: 10,
    // },
    // {
    //   level: 'error',
    //   type: 'rotating-file',
    //   path: `./logs/error.log`,
    //   period: '1d',
    //   count: 10,
    // },
  ],
})

const getProgressBar = message => {
  return new progress.Bar({
    format: `${message}: [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}`,
  }, progress.Presets.shades_classic)
}

module.exports = {
  log,
  getProgressBar,
}
