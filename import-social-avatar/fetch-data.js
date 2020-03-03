const fetch = require('node-fetch')
const log = require('./lib/logger')

const fetchAvatar = async ({ id, twitter, facebook, size }) => {
  let res
  if (twitter) {
    try {
      res = await fetch(`https://avatars.io/twitter/${twitter}/${size}`, { redirect: 'error' })
    } catch {}
  }

  if (facebook && !res) {
    try {
      const sizeType = size === 'medium' ? 'normal' : size
      res = await fetch(`https://graph.facebook.com/${facebook}/picture?type=${sizeType}`)//, { redirect: 'error' })
      if (!res.ok) {
        res = null
      }
    } catch {}
  }

  if (!res) {
    // log.error('Could not find image:')
    // twitter && log.error(`https://twitter.com/${twitter}`)
    // facebook && log.error(`https://facebook.com/${facebook}`)
    return null
  }

  return {
    id,
    size,
    body: res.body,
  }
}

module.exports = fetchAvatar
