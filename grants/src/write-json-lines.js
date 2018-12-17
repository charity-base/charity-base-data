const { grantNavJSON } = require('../config')
const jsonTojsonl = require('json-to-jsonl')
const bunyan = require('bunyan')
const log = bunyan.createLogger({ name: 'main' })

try {
  const { lines, file } = jsonTojsonl(grantNavJSON, x => x.grants)
  log.info(`Wrote ${lines} lines to ${file}`)
}
catch(e) {
  log.error(e)
}
