const { TimeoutError } = require('./errors')

const timebox = (promise, ms=5000) => {
  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new TimeoutError(`Promise was pending for ${ms}ms`))
    }, ms)
    try {
      const res = await promise
      clearTimeout(timeout)
      resolve(res)
    }
    catch(e) {
      clearTimeout(timeout)
      reject(e)
    }
  })
}

module.exports = timebox
