const fetch = require('node-fetch')
const cheerio = require('cheerio')
const log = require('./lib/logger')
const {
  facebookHandle,
  twitterHandle,
  sortHandles,
} = require('./lib/handles')
const { TimeoutError } = require('./lib/errors')
const timebox = require('./lib/timebox')

const getCleanUrl = url => {
  if (!url) {
    return null
  }
  const stripped = url.replace(/ /g, '')
  return stripped.includes('://') ? stripped : `http://${stripped}`
}

const scrape = async ({ id, url }) => {
  try {
    const cleanUrl = getCleanUrl(url)
    if (!cleanUrl) {
      throw 'No valid url'
    }
    const res = await fetch(cleanUrl)
    const html = await res.text()
    const $ = cheerio.load(html)

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

    const fb = sortHandles(facebookArr, cleanUrl)[0]
    const tw = sortHandles(twitterArr, cleanUrl)[0]

    return {
      id,
      url,
      cleanUrl,
      twitter: tw ? tw.user : undefined,
      facebook: fb ? fb.user : undefined,
    }
  } catch(e) {
    // log.error(e)
    return null
  }
}

const fetchData = ({ id, url }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await timebox(scrape(({ id, url })))
      resolve(res)
    } catch (e) {
      if (e instanceof TimeoutError) {
        // log.error('Scraping timed out')
        resolve(null)
      } else {
        reject(e)
      }
    }
  })
}

module.exports = fetchData
