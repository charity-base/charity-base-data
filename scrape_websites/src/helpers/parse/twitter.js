const ILLEGAL_HANDLES = [
  'login',
  'search',
  'intent',
  'share',
  'wix',
  'stylemixed',
  'xyz',
  'skynews',
]

const twitterHandle = url => {
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
  return ILLEGAL_HANDLES.indexOf(handle) === -1 ? handle : null
}

module.exports = twitterHandle
