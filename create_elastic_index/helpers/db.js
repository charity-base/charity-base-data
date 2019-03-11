const mongoose = require('mongoose')

const Charity = mongoose.model(
  'Charity',
  new mongoose.Schema({})
)

module.exports = {
  Charity,
}
