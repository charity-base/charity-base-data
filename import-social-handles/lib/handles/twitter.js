const ILLEGAL_HANDLES = [
  'home',
  'login',
  'search',
  'intent',
  'share',
  'stylemixed',
  'xyz',
  'skynews',
  // website builders:
  'wix',
  'hover',
  'webs',
  'wordpress',
  'onecom',
]
const MAX_LENGTH = 15

const validate = x => {
  if (!x) {
    return null
  }
  if (x.length > MAX_LENGTH) {
    return null
  }
  return x
}

const twitterHandle = url => {
  const screenName = url.split('screen_name=')[1]
  if (screenName) {
    return validate(screenName.split('&')[0])
  }

  const path = url.split('?')[0].split('#')[0].split('twitter.com/')[1]
  if (!path) return null

  const pathArray = path.split('/').filter(x => x)
  if (pathArray.length !== 1) return null

  const x = pathArray[0]
  // could also try to deal with twitter.com/intent links & get related or screen_name from query string?
  // could also deal with links to twitters e.g. twitter.com/dan/status/23ooasijfaoi
  if (!x) return null
  const stripped = x.charAt(0) === '@' ? x.slice(1) : x
  const handle = stripped && stripped.match(/^[A-Za-z0-9_]{1,15}$/) ? stripped : null
  return ILLEGAL_HANDLES.indexOf(handle.toLowerCase()) === -1 ? handle : null
}

module.exports = twitterHandle
