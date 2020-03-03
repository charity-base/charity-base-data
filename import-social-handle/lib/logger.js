const bunyan = require('bunyan')

const log = bunyan.createLogger({ name: 'main' })

module.exports = log
