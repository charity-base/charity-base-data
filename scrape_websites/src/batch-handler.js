// const http = require('http')
const https = require('https')
const axios = require('axios')
const cheerio = require('cheerio')
const { facebookHandle, twitterHandle, sortHandles } = require('./helpers')
const { timeout } = require('../config.json')

const axiosOptions = {
  timeout,
  // httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
  responseType: 'text',
}

const scrapeOne = ({ id, website }) => {
  return axios.get(website, axiosOptions)
  .then(res => {
    const $ = cheerio.load(res.data)
    const handles = {
      facebook: {},
      twitter: {},
    }
    $('a[href*="facebook.com"]').each(function(i, val) {
      const handle = facebookHandle(val.attribs.href)
      if (!handle) return
      handles['facebook'][handle] = 1 + (handles['facebook'][handle] || 0)
    })
    $('a[href*="twitter.com"]').each(function(i, val) {
      const handle = twitterHandle(val.attribs.href)
      if (!handle) return
      handles['twitter'][handle] = 1 + (handles['twitter'][handle] || 0)
    })

    const facebookArr = Object.keys(handles.facebook).map(x => ({ user: x, count: handles.facebook[x] }))
    const twitterArr = Object.keys(handles.twitter).map(x => ({ user: x, count: handles.twitter[x] }))

    const fb = sortHandles(facebookArr, website)[0]
    const tw = sortHandles(twitterArr, website)[0]
    const social = []
    if (tw) {
      social.push({ platform: 'twitter', handle: tw.user })
    }
    if (fb) {
      social.push({ platform: 'facebook', handle: fb.user })
    }

    return social
  })
  .catch(e => {
    // console.log(e)
    // Swallow errors
    return []
  })
}

const updateOne = ({ id, social }) => {
  return {
    updateOne: {
      filter: { 'ids.GB-CHC': id },
      update: {
        $set: {
          'contact.social': social,
        },
      },
    },
  }
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

const batchHandler = (parsedItems, Charity) => {
  return Promise.all(parsedItems.map(scrapeOne))
  .then(items => {
    const ops = items.map((social, i) => {
      const id = parsedItems[i].id
      return updateOne({ id, social })
    })
    return bulkWrite(ops, Charity)
  })
}

module.exports = batchHandler
