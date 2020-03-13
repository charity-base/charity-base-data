const soap = require('soap')
const { CC_SOAP_URL } = process.env

module.exports = soap.createClientAsync(CC_SOAP_URL)
