require('dotenv').config()
const { pipeline } = require('stream')
const fetch = require('node-fetch')
const unzipper = require('unzipper')
const getProgressBar = require('./lib/progress')
const log = require('./lib/logger')

const MB_TOTAL_ESTIMATE = 141
const MB_PROGRESS_STEP = 1

const downloadUnzip = (url, path) => (
  new Promise(async (resolve, reject) => {
    if (!url) {
      reject('Missing zipped data URL')
    }
    if (!path) {
      reject('Missing download destination')
    }

    let bytes = 0
    let i = 0
    let progressBar
    let res
    try {
      log.info(`Downloading & unzipping data to '${path}'`)
      res = await fetch(url)
      progressBar = getProgressBar('Download Progress (MB)')
      progressBar.start(MB_TOTAL_ESTIMATE, 0)
      res.body.on("data", chunk => {
        bytes += chunk.length
        const step = Math.floor(bytes/(1000000*MB_PROGRESS_STEP))
        if (step > i) {
          progressBar.update(Math.round(bytes/1000000))
          i = step
        }
      })
    } catch(e) {
      reject(e)
    }

    pipeline(
      res.body,
      unzipper.Extract({ path }),
      (err) => {
        if (err) {
          reject(err)
        } else {
          progressBar.update(Math.round(bytes/1000000))
          progressBar.stop()
          resolve(bytes)
        }
      }
    )
  })
)

async function f() {
  try {
    await downloadUnzip(
      process.env.CC_ZIPPED_DATA_URL,
      process.env.CC_DOWNLOAD_DESTINATION
    )
  } catch(e) {
    log.error(e)
    process.exit(1)
  }
}

f()
