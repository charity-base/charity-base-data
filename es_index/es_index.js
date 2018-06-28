const log = require('./logger')
const Charity = require('./Charity')
const mongoose = require('mongoose')
mongoose.Promise = global.Promise

const DB_HOST = 'localhost'
const DB_PORT = '27017'
const DB_NAME = 'charity-base-june-2018'

log.info(`Starting process with NODE_ENV=${process.env.NODE_ENV}`)

const connectToDb = (address, config) => {
  return new Promise((resolve, reject) => {
    mongoose.connect(address, config).then(resolve, reject)
  })
}

// Took ~40 minutes to run on 1GB machine with 400MB heap
const indexWithES = Model => {
  Model.createMapping({}, function(err, mapping){
    if (err) {
      return log.error(err)
    }
    log.info("Successfully created mapping")
    log.info(mapping)
    // return
    const stream = Model.synchronize()
    let count = 0

    log.info("Starting to index documents.")
    stream.on('data', function(err, doc){
      count++;
      if (count % 1000 === 0) {
        log.info(count)
      }
    });
    stream.on('close', function(){
      log.info(`Finished indexing ${count} documents.`);
    });
    stream.on('error', function(err){
      log.error(err);
    });
  })
}


connectToDb(`mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`, {
  useMongoClient: true,
  // autoIndex: true
}).then(() => {
  indexWithES(Charity)
}).catch(err => {
  log.error(err)
  process.exit(1)
})

process.on('uncaughtException', err => {
  log.error(err)
  process.exit(1)
})
