require('dotenv').config()
const { pipeline } = require('stream')
const fs = require('fs')
const fetch = require('node-fetch')
const getProgressBar = require('./lib/progress')
const log = require('./lib/logger')

const MB_TOTAL_ESTIMATE = 301
const MB_PROGRESS_STEP = 1

const download = (url, path, fileName) => (
  new Promise(async (resolve, reject) => {
    if (!url) {
      reject('Missing data URL')
    }
    if (!path) {
      reject('Missing download destination')
    }

    try {
      await fs.promises.mkdir([__dirname, path].join('/'), { recursive: true })
    } catch (e) {}

    const writeStream = fs.createWriteStream([__dirname, path, fileName].join('/'))

    let bytes = 0
    let i = 0
    let progressBar
    let res
    try {
      log.info(`Downloading data to '${path}'`)
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
      writeStream,
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
    await download(
      process.env.GRANTNAV_CSV_URL,
      process.env.GRANTNAV_DOWNLOAD_DESTINATION,
      process.env.GRANTNAV_FILENAME
    )
  } catch(e) {
    log.error(e)
    process.exit(1)
  }
}

f()
