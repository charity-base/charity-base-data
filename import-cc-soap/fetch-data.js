const log = require('./lib/logger')
const soapClient = require('./lib/soap-client')
const { CC_SOAP_KEY, REQUEST_TIMEOUT } = process.env

const UPPER_TERMS = ['obe', 'cbe', 'mbe', 'fca', 'frs', 'cllr', 'jp', 'gp', 'dl', 'phd', 'ba', 'ma', 'bsci', 'msci', 'mp', 'ca', 'cfa', 'cpa']

let nameCase = name => {
  if (!name) return ''
  const terms = name.trim().toLowerCase().split(/[ /]+/)

  return terms.reduce((agg, x) => {
    if (UPPER_TERMS.indexOf(x) > -1) {
      return `${agg}${x.toUpperCase()} `
    }
    const barrels = x.split(/[-/]+/)
    const term = barrels.map(y => `${y.charAt(0).toUpperCase()}${y.slice(1)}`).join('-')

    return `${agg}${term} `
  }, '').trim()
}

const fetchData = async id => {
  try {
    const client = await soapClient
    const [result] = await client.GetCharityTrusteesAsync({
      APIKey: CC_SOAP_KEY,
      registeredCharityNumber: id,
      subsidiaryNumber: 0,
    }, {
      timeout: parseInt(REQUEST_TIMEOUT),
    })
    if (!result.GetCharityTrusteesResult || !result.GetCharityTrusteesResult.Trustee) {
      // log.error(id)
      throw new Error('No GetCharityTrusteesResult property returned')
    }
    const trusteeObjects = result.GetCharityTrusteesResult.Trustee.map(x => ({
      id: x.TrusteeNumber,
      name: nameCase(x.TrusteeName),
      trusteeships: x.RelatedCharitiesCount + 1,
      otherCharities: (x.RelatedCharities || []).map(y => ({
        id: y.CharityNumber,
        name: nameCase(y.CharityName),
        status: y.SubmissionsStatus,
      })),
    }))
    return {
      id,
      trusteeObjects,
    }
  } catch(err) {
    // log.error(err)
    return null
  }
}

module.exports = fetchData
