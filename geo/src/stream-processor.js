const streamBatchPromise = require('stream-batch-promise')
const { fetchJSON } = require('./helpers')

const parser = x => ({
  _id: x._doc._id,
  postcode: x._doc.contact.postcode,
})

const postcodeUrl = postcode => {
  return `https://api.postcodes.io/postcodes/${postcode}`
}

const getGeo = postcode => {
  return fetchJSON(postcodeUrl(postcode))
  .then(res => {
    const geo = res.result || {}
    if (geo && geo.longitude) return geo
    // Assign rough location if in Channel Islands or Isle of Man:
    if (postcode.substr(0,2) === 'GY') {
      return {
        ...geo,
        latitude: 49.4555,
        longitude: -2.5368,
      }
    }
    if (postcode.substr(0,2) === 'JE') {
      return {
        ...geo,
        latitude: 49.181,
        longitude: -2.081,
      }
    }
    if (postcode.substr(0,2) === 'IM') {
      return {
        ...geo,
        latitude: 54.145,
        longitude: -4.482,
      }
    }
    return geo
  })
  .catch(e => {
    // Swallow fetch errors
    return {}
  })
}

const getGeos = postcodes => {
  return Promise.all(postcodes.map(x => getGeo(x)))
}

const geoCoordsString = ({ latitude, longitude }) => {
  const isLocated = (typeof latitude === 'number') && (typeof longitude === 'number')
  return isLocated ? `${latitude},${longitude}` : null
}

const updateOne = ({ _id, geo }) => {
  return {
    updateOne: {
      filter: { _id },
      update: {
        $set: {
          'contact.geo': geo,
          'contact.geoCoords': geoCoordsString(geo),
        },
      },
    },
  }
}

const bulkWrite = (bulkOps, Charity) => {
  return new Promise((resolve, reject) => {
    Charity.collection.bulkWrite(
      bulkOps,
      { "ordered": true, w: 1 },
      (err, response) => {
        if (err) {
          return reject(err)
        }
        return resolve(response)
      }
    )
  })
}

const getAndSet = (parsedItems, Charity) => {
  return getGeos(parsedItems.map(x => x.postcode))
  .then(geos => {
    const ops = geos
    .map((geo, i) => {
      const _id = parsedItems[i]._id
      return ({ _id, geo })
    })
    .map(updateOne)
    return bulkWrite(ops, Charity)
  })
}

const getCharityGeos = (Charity, onCounterChange) => streamBatchPromise(
  Charity.find({ 'contact.geoCoords': null }).cursor(),
  parser,
  (parsedItems, counter) => {
    onCounterChange(counter)
    return getAndSet(parsedItems, Charity)
  },
  { batchSize: 50 },
)

module.exports = getCharityGeos
