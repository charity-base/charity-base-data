const streamBatchPromise = require('stream-batch-promise')

const parser = x => x.toJSON()

const bulkInsert = (parsedItems, client, _index) => {
  const body = parsedItems.reduce((agg, x) => {
    const { _id, ...charityWithoutId } = x
    return [
      ...agg,
      {
        index: {
          _id,
          _index,
          _type: 'charity',
        },
      },
      charityWithoutId
    ]
  }, [])

  return new Promise((resolve, reject) => {
    client.bulk(
      { body },
      (err, res) => {
        if (err) {
          return reject(err)
        }
        if (res.errors) {
          const errItems = res.items.filter(x => x.index.error)
          return reject(errItems)
        }
        return resolve(res)
      }
    )
  })
}

const insert = (Charity, esClient, esIndex, onCounterChange) => streamBatchPromise(
  Charity.find().cursor(),
  parser,
  (parsedItems, counter) => {
    onCounterChange(counter)
    return bulkInsert(
      parsedItems,
      esClient,
      esIndex
    )
  },
  { batchSize: 1000 },
)

module.exports = insert
