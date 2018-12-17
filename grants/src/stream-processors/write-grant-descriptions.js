const streamBatchPromise = require('stream-batch-promise')
const fsPromises = require('fs').promises

const parser = x => ({
  _id: x._doc._id,
  description: x._doc.description,
})

const prepText = x => {
  try {
    const cleanText = x.replace(/,/g, ' ').replace(/-/g, ' ').replace(/\//g, ' ').replace(/  */g, ' ')
    return cleanText
  }
  catch(e) {
    return null
  }
}

const writeDescription = (parsedItems, dir) => {
  return Promise.all(
    parsedItems.map(({ _id, description }) => (
      fsPromises.writeFile(
        `${dir}/${_id}`,
        prepText(description)
      )
    ))
  )
}

const writeGrantDescriptions = (Grant, dir, onCounterChange) => streamBatchPromise(
  Grant.find({
    'recipientOrganization.GB-CHC': { $ne: null },
  }).cursor(),
  parser,
  (parsedItems, counter) => {
    onCounterChange(counter)
    return writeDescription(parsedItems, dir)
  },
  { batchSize: 1000 },
)

module.exports = writeGrantDescriptions
