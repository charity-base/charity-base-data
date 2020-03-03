const progress = require('cli-progress')

const getProgressBar = message => {
  return new progress.Bar({
    format: `${message}: [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}`,
  }, progress.Presets.shades_classic)
}

module.exports = getProgressBar