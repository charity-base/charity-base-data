const mongoose = require('mongoose')
const { log } = require('./helpers')
const scrape = require('./scrape')
const levenshtein = require('js-levenshtein')
const { facebookHandle, twitterHandle } = require('./helpers')

const SOCIAL_DOMAINS = [
  'twitter.com', // should also deal with t.co and twitter.co.uk?
  'facebook.com',
  'youtube.com',
  'instagram.com',
  'linkedin.com',
  'plus.google.com',
  'flickr.com'
]

const ILLEGAL_HANDLES = [
  'login',
  'search',
  'intent',
  'share',
  'wix',
  'stylemixed',
  'xyz',
  'skynews',
  'pages', // fb
  'sharer', // fb
  'groups', // fb
  'watch', // fb
]

const cleanUrl = (url) => {
  if (!url) return null
  const clean = url.trim() //.toLowerCase()
  if (!clean) return null
  if (clean.indexOf('http://') === 0) return clean
  if (clean.indexOf('https://') === 0) return clean
  return 'http://' + clean
}

const parsePage = async page => {
  await page.waitForSelector('a', { timeout: 3000 })
  hrefs = await page.$$eval('a', els => els.map(el => el.getAttribute('href')));
  return {
    hrefs,
  }
}

const unleak = x => (' ' + x).substr(1)

const scrapeOne = ({ _id, website }) => {
  const url = cleanUrl(website)
  if (!url) return { _id, socialHandles: [] }
  return scrape(url, parsePage)
  .then(payload => {
    if (!payload) return { _id, socialHandles: [] }
    const { hrefs } = payload
    if (!hrefs) return { _id, socialHandles: [] }
    // const $ = cheerio.load(html)
    const links = []
    hrefs.forEach(href => {
      links.push(...SOCIAL_DOMAINS.reduce((agg, x) => {
        if (href && href.indexOf(x) > -1) return [...agg, unleak(href)]
        return agg
      }, []))
    })
    const twitter = {}
    const facebook = {}
    links.forEach(function(s) {
      const fbUser = facebookHandle(s)
      const twitterUser = twitterHandle(s)
      if (fbUser) {
        facebook[fbUser] = facebook[fbUser] ? (facebook[fbUser] + 1) : 1
      }
      if (twitterUser) {
        twitter[twitterUser] = twitter[twitterUser] ? (twitter[twitterUser] + 1) : 1
      }
    })
    const twitterHandles = Object.keys(twitter).map(x => ({ user: x, count: twitter[x] })).sort((a, b) => {
      const countDiff = b.count - a.count
      if (countDiff !== 0) return countDiff
      return levenshtein(url, a.user) - levenshtein(url, b.user)
    })
    const facebookHandles = Object.keys(facebook).map(x => ({ user: x, count: facebook[x] })).sort((a, b) => {
      const countDiff = b.count - a.count
      if (countDiff !== 0) return countDiff
      return levenshtein(url, a.user) - levenshtein(url, b.user)
    })

    const socialHandles = []
    if (twitterHandles[0]) {
      socialHandles.push({
        platform: 'twitter',
        handle: twitterHandles[0].user,
      })
    }
    if (facebookHandles[0]) {
      socialHandles.push({
        platform: 'facebook',
        handle: facebookHandles[0].user,
      })
    }

    return {
      _id,
      socialHandles,
    }
  })
  .catch(e => {
    // log.error(e)
    // Swallow errors
    return {}
  })
}

const scrapeItems = items => {
  return Promise.all(items.map(scrapeOne))
}

const updateOne = ({ _id, socialHandles }) => {
  if (!socialHandles || !socialHandles.length) return
  return {
    updateOne: {
      filter: { _id: mongoose.Types.ObjectId(_id) },
      update: {
        $set: {
          // social,
          'contact.social': socialHandles,
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
  return scrapeItems(parsedItems)
  .then(items => {
    const ops = items.map(updateOne).filter(x => x)
    if (ops.length === 0) return
    return bulkWrite(ops, Charity)
  })
}

module.exports = batchHandler
