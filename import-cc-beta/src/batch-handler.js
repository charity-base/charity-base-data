const fetch = require('node-fetch')
const cheerio = require('cheerio')

const betaUrl = id => {
  return `https://beta.charitycommission.gov.uk/charity-details/?regId=${id}&subId=0`
}

const scrapeOne = id => {
  return fetch(betaUrl(id))
  .then(res => res.text())
  .then(html => {
    const $ = cheerio.load(html)
    const activities = $('div.row div.pcg-charity-details__block.col-12 p', '#overview').text() || null
    const peopleItems = $('div.row div.col-lg-3 ul.pcg-charity-details__stats li.pcg-charity-details__fact', '#people')
    const peopleCount = $('span.pcg-charity-details__amount--people', peopleItems).toArray().map(x => parseInt($(x).text().trim().replace(/,/g, ''))) || []
    const peopleTitles = $('span.pcg-charity-details__purpose', peopleItems).toArray().map(x => $(x).text().toLowerCase()) || []
    const people = peopleTitles.reduce((agg, x, i) => ({ ...agg, [x]: peopleCount[i]}), {})
    return {
      activities,
      people,
    }
  })
  .catch(e => {
    console.log(e)
    // Swallow errors
    return {}
  })
}

const scrapeItems = ids => {
  return Promise.all(ids.map(x => scrapeOne(x)))
}

const updateOne = ({ id, data }) => {
  return {
    updateOne: {
      filter: { 'ids.GB-CHC': id },
      update: {
        $set: {
          'activities': data.activities,
          'people': data.people,
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
  return scrapeItems(parsedItems.map(x => x.ids['GB-CHC']))
  .then(items => {
    const ops = items.map((data, i) => {
      const id = parsedItems[i].ids['GB-CHC']
      return updateOne({ id, data })
    })
    return bulkWrite(ops, Charity)
  })
}

module.exports = batchHandler
