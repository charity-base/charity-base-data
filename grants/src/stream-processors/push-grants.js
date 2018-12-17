const streamBatchPromise = require('stream-batch-promise')

const parser = x => {
  const {
    id,
    title,
    amountAwarded,
    currency,
    awardDate,
    description,
    classifications,
    plannedDate,
    fundingOrganization,
    recipientOrganization,
    beneficiaryLocation,
    topicModelling,
  } = x._doc

  return {
    updateOne: {
      filter: { 'ids.GB-CHC': recipientOrganization[0]['GB-CHC'] },
      update: { '$push': { grants: {
        id,
        title,
        amountAwarded,
        currency,
        awardDate,
        description,
        classifications,
        plannedDate,
        fundingOrganization,
        recipientOrganization,
        beneficiaryLocation,
        topicModelling,
      } } },
    }
  }
}

const bulkPush = (parsedItems, Charity) => {
  return new Promise((resolve, reject) => {
    Charity.collection.bulkWrite(
      parsedItems,
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

const pushGrantsToCharities = (Grant, Charity, onCounterChange) => streamBatchPromise(
  Grant.find({
    'recipientOrganization.GB-CHC': { $ne: null },
  }).cursor(),
  parser,
  (parsedItems, counter) => {
    onCounterChange(counter)
    return bulkPush(parsedItems, Charity)
  },
  { batchSize: 1000 },
)

module.exports = pushGrantsToCharities
