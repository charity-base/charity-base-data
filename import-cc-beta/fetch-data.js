const fetch = require('node-fetch')
const cheerio = require('cheerio')
const log = require('./lib/logger')
const { CC_BETA_URL } = process.env

const betaUrl = id => `${CC_BETA_URL}?regId=${id}&subId=0`

const cleanActivities = x => {
  if (!x) {
    return null
  }
  const trimmed = x.trim()
  if (!trimmed) {
    return null
  }
  if (trimmed.toLowerCase() === 'none') {
    return null
  }
  return trimmed
}

const scrape = async id => {
  try {
    const res = await fetch(betaUrl(id))
    const html = await res.text()
    const $ = cheerio.load(html)
    const activities = cleanActivities($('div.row div.pcg-charity-details__block.col-12 p', '#overview').text())
    const peopleItems = $('div.row div.col-lg-3 ul.pcg-charity-details__stats li.pcg-charity-details__fact', '#people')
    const peopleCount = $('span.pcg-charity-details__amount--people', peopleItems).toArray().map(x => parseInt($(x).text().trim().replace(/,/g, ''))) || []
    const peopleTitles = $('span.pcg-charity-details__purpose', peopleItems).toArray().map(x => $(x).text().toLowerCase()) || []
    const people = peopleTitles.reduce((agg, x, i) => ({ ...agg, [x]: peopleCount[i]}), {})
    return {
      id,
      activities,
      people,
    }
  } catch(e) {
    log.error(e)
    return null
  }
}

const timebox = (promise, name, shouldReject=false, ms=5000) => {
  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      const msg = `Promise '${name}' timed out after ${ms}ms`
      log.error(msg)
      shouldReject ? reject(new Error(msg)) : resolve(null)
    }, ms)
    try {
      const res = await promise
      clearTimeout(timeout)
      resolve(res)
    }
    catch(e) {
      clearTimeout(timeout)
      reject(e)
    }
  })
}

const fetchData = regno => timebox(scrape(regno), 'scrape beta')

module.exports = fetchData
