const streamBatchPromise = require('stream-batch-promise')

const parser = x => ({
  _id: x._doc._id,
  recipientOrganization: x._doc.recipientOrganization,
})

const getCharityNumber = recipientOrganization => {
  try {
    const charityIdString = recipientOrganization[0].id
    const charityNumber = Number(charityIdString.split('GB-CHC-')[1].replace(/ /g, '').split(':')[0].trim())
    return charityNumber
  }
  catch(err) {
    return null
  }
}

const setCharityNumber = (parsedItems, Grant) => {
  return new Promise((resolve, reject) => {
    Grant.collection.bulkWrite(
      parsedItems.map(({ _id, recipientOrganization }) => ({
        updateOne: {
          filter: { _id },
          update: { $set: { 'recipientOrganization.0.GB-CHC': getCharityNumber(recipientOrganization) } },
        }
      })),
      { "ordered": true, w: 1 },
      (err, response) => {
        if (err) {
          return reject(err)
        }
        return resolve(response)
      }
    )
  })
}

const setGrantRecipients = (Grant, onCounterChange) => streamBatchPromise(
  Grant.find().cursor(),
  parser,
  (parsedItems, counter) => {
    onCounterChange(counter)
    return setCharityNumber(parsedItems, Grant)
  },
  { batchSize: 1000 },
)

module.exports = setGrantRecipients
