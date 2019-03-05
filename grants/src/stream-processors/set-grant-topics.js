const fs = require('fs')
const csv = require('fast-csv')
const streamBatchPromise = require('stream-batch-promise')
const mongoose = require('mongoose')

const topicScores = arr => {
  return arr.map((x, i) => ({
    id: i,
    name: `topic-${i}`,
    score: x,
  }))
}

const parser = x => {
  const [ i, file, ...classifications ] = x
  const filePathArray = file.split('/')
  const grantIdString = filePathArray[filePathArray.length - 1]
  const grantId = mongoose.Types.ObjectId(grantIdString)

  const topics = topicScores(classifications.map(Number))
  return {
    updateOne: {
      filter: { _id: grantId },
      update: { $set: { 'topicModelling.topics': topics } },
    }
  }
}

const bulkUpdate = (parsedItems, Grant) => {
  return new Promise((resolve, reject) => {
    Grant.collection.bulkWrite(
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

const setGrantTopics = (Grant, docTopicsFile, onCounterChange) => streamBatchPromise(
  fs.createReadStream(docTopicsFile)
  .pipe(csv({ delimiter: '\t' })),
  parser,
  (parsedItems, counter) => {
    onCounterChange(counter)
    return bulkUpdate(parsedItems, Grant)
  },
  { batchSize: 1000 },
)

module.exports = setGrantTopics
