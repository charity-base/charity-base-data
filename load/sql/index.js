const createAcctSubmit = require('./Build_extract_acct_submit')
const createAooRef = require('./Build_extract_aoo_ref')
const createArSubmit = require('./Build_extract_ar_submit')
const createCharity = require('./Build_extract_charity')
const createCharityAoo = require('./Build_extract_charity_aoo')
const createClass = require('./Build_extract_class')
const createClassRef = require('./Build_extract_class_ref')
const createFinancial = require('./Build_extract_financial')
const createMainCharity = require('./Build_extract_main_charity')
const createName = require('./Build_extract_name')
const createObjects = require('./Build_extract_objects')
const createOverseasExpend = require('./Build_extract_overseas_expend')
const createPartB = require('./Build_extract_partb')
const createRegistration = require('./Build_extract_registration')
const createRemoveRef = require('./Build_extract_remove_ref')
const createTrustee = require('./Build_extract_trustee')

module.exports = [
  createAcctSubmit,
  createAooRef,
  createArSubmit,
  createCharity,
  createCharityAoo,
  createClass,
  createClassRef,
  createFinancial,
  createMainCharity,
  createName,
  createObjects,
  createOverseasExpend,
  createPartB,
  createRegistration,
  createRemoveRef,
  createTrustee,
]