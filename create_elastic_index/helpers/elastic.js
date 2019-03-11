const bulkInsert = (parsedItems, client, _index) => {
  const body = parsedItems.reduce((agg, x) => {
    const { _id, ...charityWithoutId } = x
    return [
      ...agg,
      {
        index: {
          _id,
          _index,
          _type: '_doc',
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
          const errItems = res.items.filter(x => x.index.error).map(x => x.index.error)
          return reject(errItems)
        }
        return resolve(res)
      }
    )
  })
}

module.exports = {
  bulkInsert,
}
