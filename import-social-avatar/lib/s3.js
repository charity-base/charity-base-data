const AWS = require('aws-sdk')

const {
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
  S3_REGION
} = process.env

const credentials = new AWS.Credentials(S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY)

const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: S3_REGION,
  credentials,
})

module.exports = s3