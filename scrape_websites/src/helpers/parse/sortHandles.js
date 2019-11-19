const levenshtein = require('js-levenshtein')

const sort = (handlesArr, url) => {
  return handlesArr.sort((a, b) => {
    const countDiff = b.count - a.count
    if (countDiff !== 0) return countDiff
    // if the count is the same, choose the one most similar to url
    return levenshtein(url, a.user) - levenshtein(url, b.user)
  })
}

module.exports = sort
