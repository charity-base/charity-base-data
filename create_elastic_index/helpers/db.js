const mongoose = require('mongoose')
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
  new mongoose.Schema({})
)

module.exports = {
  connectToDb,
  Charity,
}
