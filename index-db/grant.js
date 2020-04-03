require('dotenv').config()
const fs = require('fs')
const log = require('./lib/logger')
const { pipeline } = require('stream')
const knex = require('./knex-connection')
const createTransformer = require('./create-transformer')

const {
  TABLE_GRANTNAV,
  JSON_DATA_DIR,
} = process.env

const FILENAME = 'grant.json'

const query = knex
  .select([
    `recipient_charity_number as id`,
    knex.raw(`JSON_ARRAYAGG(
      JSON_OBJECT(
        'id', id,
        'title', title,
        'description', description,
        'amountAwarded', amount_awarded,
        'awardDate', date_awarded,
        'currency', currency,
        'fundingOrganization', JSON_OBJECT('id', funder_id, 'name', funder_name)
      )
    ) as grants`),
  ])
  .from(TABLE_GRANTNAV)
  .groupBy('recipient_charity_number')

log.info(query.toString())


const parser = x => {
  if (!x.id || !x.grants) return null
  // Sort grants by descending award date
  const grantsList = x.grants.sort((a, b) => new Date(b.awardDate) - new Date(a.awardDate))
  const fundersDict = grantsList.reduce((agg, { fundingOrganization }) => agg[fundingOrganization.id] ? agg : ({
    ...agg,
    [fundingOrganization.id]: fundingOrganization.name
  }), {})
  const fundersList = Object.keys(fundersDict).map(id => ({ id, name: fundersDict[id] }))
  return {
    id: x.id,
    grants: grantsList,
    funders: fundersList,
    numGrants: grantsList.length, // should we limit to 20 most recent?
    numFunders: fundersList.length,
  }
}

const f = async () => {
  try {
    await fs.promises.mkdir([__dirname, JSON_DATA_DIR].join('/'), { recursive: true })
  } catch (e) {}

  pipeline(
    query.stream(),
    createTransformer(parser),
    fs.createWriteStream([__dirname, JSON_DATA_DIR, FILENAME].join('/')),
    err => {
      if (err) {
        log.error(err)
      } else {
        log.info('Finished successfully')
      }
      knex.destroy()
    }
  )
}

f()
