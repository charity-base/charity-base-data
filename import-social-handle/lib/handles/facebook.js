const ILLEGAL_HANDLES = [
  'login',
  'search',
  'intent',
  'share',
  'wix',
  'stylemixed',
  'xyz',
  'skynews',
  'pages',
  'sharer',
  'groups',
  'watch',
]
const MAX_LENGTH = 50

const validate = x => {
  if (!x) {
    return null
  }
  if (x.length > MAX_LENGTH) {
    return null
  }
  return x
}

const facebookHandle = url => {
  const path = url.split('?')[0].split('#')[0].split('facebook.com/')[1]
  if (!path) return null
  
  const pathArray = path.split('/').filter(x => x)
  if (pathArray.length === 0) return null
  
  if (pathArray[0].substring(pathArray[0].length-4) === '.php') {
    const id = url.split('id=')[1]
    return id ? validate(id.split('&')[0]) : null
  }
  
  if (pathArray.length === 1) {
    const id = pathArray[0]
    return ILLEGAL_HANDLES.indexOf(id) === -1 ? validate(id) : null
  }
  
  if (pathArray[0] === 'pages') {
    const id = pathArray[3] || pathArray[2] || pathArray[1] || null
    return ILLEGAL_HANDLES.indexOf(id) === -1 ? validate(id) : null
  }
}

module.exports = facebookHandle
