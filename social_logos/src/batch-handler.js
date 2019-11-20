const { log } = require('./helpers')
const fetch = require('node-fetch')
const s3 = require('./s3')
const { s3: s3Config } = require('../config.json')

const uploadSingleSize = async ({ _id, id, social, twitterHandle, fbHandle, size }) => {
  let res
  if (twitterHandle) {
    try {
      res = await fetch(`https://avatars.io/twitter/${twitterHandle}/${size}`, { redirect: 'error' })
    } catch {}
  }

  if (fbHandle && !res) {
    try {
      const sizeType = size === 'medium' ? 'normal' : size
      res = await fetch(`https://graph.facebook.com/${fbHandle}/picture?type=${sizeType}`)//, { redirect: 'error' })
      if (!res.ok) {
        res = null
      }
    } catch {}
  }

  if (!res) {
    log.error('Could not find image:')
    twitterHandle && log.error(`https://twitter.com/${twitterHandle}`)
    fbHandle && log.error(`https://facebook.com/${fbHandle}`)
    return
  }

  try {
    await s3.upload({
      Bucket: s3Config.bucket,
      Key: `${s3Config.path}/${size}/${id}`,
      Body: res.body,
    }).promise()

    return {
      updateOne: {
        filter: { _id },
        update: {
          $set: {
            [`image.logo.${size}`]: {
              Bucket: s3Config.bucket,
              Key: `${s3Config.path}/${size}/${id}`,
            },
          },
        },
      },
    }
  } catch(e) {
    log.error(`Failed to upload image: "${id}"`)
    log.error(e)
  }
}

const uploadAllSizes = async ({ _id, id, social }) => {
  if (!social) return null
  const twitterSocial = social.find(x => x.platform === 'twitter')
  const twitterHandle = twitterSocial ? twitterSocial.handle : null
  const fbSocial = social.find(x => x.platform === 'facebook')
  const fbHandle = fbSocial ? fbSocial.handle : null

  const sizes = ['small', 'medium', 'large']

  const dbUpdates = await Promise.all(sizes.map(size => uploadSingleSize({ _id, id, social, twitterHandle, fbHandle, size })))
  return dbUpdates
}

const uploadImages = items => {
  return Promise.all(items.map(uploadAllSizes))
}

const bulkWrite = (bulkOps, Charity) => {
  return new Promise((resolve, reject) => {
    Charity.collection.bulkWrite(
      bulkOps,
      { "ordered": false, w: 1 },
      (err, response) => {
        if (err) {
          return reject(err)
        }
        return resolve(response)
      }
    )
  })
}

const batchHandler = async (parsedItems, Charity) => {
  const batchUpdates = (await uploadImages(parsedItems)).reduce((agg, x) => [...agg, ...x.filter(y=>y)], [])
  return batchUpdates.length ? bulkWrite(batchUpdates, Charity) : null
}

module.exports = batchHandler
