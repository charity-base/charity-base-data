const log = require('./lib/logger')
const soapClient = require('./lib/soap-client')
const titleCase = require('./lib/title-case')
const UPPER_TERMS = require('./name-acronyms')

const { CC_SOAP_KEY, REQUEST_TIMEOUT } = process.env

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
      name: titleCase(x.TrusteeName, UPPER_TERMS),
      trusteeships: x.RelatedCharitiesCount + 1,
      otherCharities: (x.RelatedCharities || []).map(y => ({
        id: y.CharityNumber,
        name: titleCase(y.CharityName),
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
