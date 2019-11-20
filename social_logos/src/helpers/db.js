const mongoose = require('mongoose')
const { mongooseSchema } = require('charity-base-schema')
mongoose.Promise = global.Promise

const connectToDb = ({ host, port, name }, config) => {
  return new Promise((resolve, reject) => {
    mongoose.connect(
      `mongodb://${host}:${port}/${name}`,
      config,
    ).then(resolve, reject)
  })
}

const Charity = mongoose.model(
  'Charity',
  mongooseSchema.charity(mongoose)
)

module.exports = {
  connectToDb,
  Charity,
}
