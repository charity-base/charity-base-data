const cleanText = x => {
  if (!x) {
    return ''
  }
  return x.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

module.exports = cleanText