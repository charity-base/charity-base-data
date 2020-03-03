const axios = require('axios')
const cheerio = require('cheerio')
const log = require('./lib/logger')
const {
  facebookHandle,
  twitterHandle,
  sortHandles,
} = require('./lib/handles')

const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT)

// We implement timeout cancelling manually since the `timeout` option seems to be unreliable
// https://github.com/axios/axios/issues/647
const axiosGet = (url, options = {}) => {
  const abort = axios.CancelToken.source()
  const id = setTimeout(() => {
    abort.cancel(`Timeout of ${REQUEST_TIMEOUT}ms.`)
  }, REQUEST_TIMEOUT)
  return axios
    .get(url, { cancelToken: abort.token, ...options })
    .then(response => {
      clearTimeout(id)
      return response
    })
    .catch(e => {
      clearTimeout(id)
      throw e
    })
}

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
    const res = await axiosGet(cleanUrl, {
      // timeout: REQUEST_TIMEOUT,
    })
    const html = res.data
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
    // if (e.code === 'ECONNABORTED')
    return null
  }
}

module.exports = scrape
