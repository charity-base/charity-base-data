let titleCase = (str, upperTerms=[]) => {
  // upperTerms should be array of *lower case* strings
  if (!str) return ''
  const terms = str.trim().toLowerCase().split(/[ /]+/)

  return terms.reduce((agg, x) => {
    if (upperTerms.indexOf(x) > -1) {
      return `${agg}${x.toUpperCase()} `
    }
    const barrels = x.split(/[-/]+/)
    const term = barrels.map(y => `${y.charAt(0).toUpperCase()}${y.slice(1)}`).join('-')

    return `${agg}${term} `
  }, '').trim()
}

module.exports = titleCase
