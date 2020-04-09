require('dotenv').config()
const { Client } = require('@elastic/elasticsearch')
const { AmazonConnection } = require('aws-elasticsearch-connector')

const {
  CHARITY_BASE_ES_AWS_URL,
  CHARITY_BASE_ES_AWS_REGION,
  CHARITY_BASE_ES_AWS_ACCESS_KEY_ID,
  CHARITY_BASE_ES_AWS_SECRET_ACCESS_KEY,
} = process.env

const client = new Client({
  node: CHARITY_BASE_ES_AWS_URL,
  region: CHARITY_BASE_ES_AWS_REGION,
  Connection: AmazonConnection,
  awsConfig: {
    credentials: {
      accessKeyId: CHARITY_BASE_ES_AWS_ACCESS_KEY_ID,
      secretAccessKey: CHARITY_BASE_ES_AWS_SECRET_ACCESS_KEY,
    }
  }
})

module.exports = client
