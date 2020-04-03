const { Transform } = require('stream')

const createTransformer = parser => new Transform({
  writableObjectMode: true,
  transform(chunk, encoding, callback) {
    if (chunk) {
      const doc = parser(chunk)
      if (doc) {
        this.push(JSON.stringify(doc) + '\n')
      }
    } else {
      this.push(chunk)
    }
    callback()
  }
})

module.exports = createTransformer
