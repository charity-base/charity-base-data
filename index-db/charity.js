require('dotenv').config()
const fs = require('fs')
const log = require('./lib/logger')
const { pipeline } = require('stream')
const knex = require('./knex-connection')
const createTransformer = require('./create-transformer')

const {
  TABLE_CHARITY,
  TABLE_MAIN_CHARITY,
  JSON_DATA_DIR,
} = process.env

const FILENAME = 'charity.json'

const query = knex
  .select([
    'c.regno as id',
    'c.name as primaryName',
    'c.gd as governingDoc',
    'c.aob as areaOfBenefit',
    'c.postcode as postcode',
    'c.phone as phone',
    knex.raw(`JSON_ARRAY(c.add1, c.add2, c.add3, c.add4, c.add5) as address`),
    'mc.web as website',
    'mc.email as email',
    'mc.fyend as financialYearEnd',
    'mc.coyno as companyId',
  ])
  .from(`${TABLE_CHARITY} as c`)
  .join(`${TABLE_MAIN_CHARITY} as mc`, 'mc.regno', '=', 'c.regno')
  .where('c.subno', '=', '0')
  .where('c.orgtype', '=', 'R')

log.info(query.toString())


const parser = x => {
  if (!x.id) return null
  x.address = x.address.filter(x => x)
  return x
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
