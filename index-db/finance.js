require('dotenv').config()
const fs = require('fs')
const log = require('./lib/logger')
const { pipeline } = require('stream')
const knex = require('./knex-connection')
const createTransformer = require('./create-transformer')

const {
  TABLE_FINANCIAL,
  JSON_DATA_DIR,
} = process.env

const FILENAME = 'finance.json'

const query = knex
  .select([
    `regno as id`,
    knex.raw(`JSON_ARRAYAGG(
      JSON_OBJECT(
        'income', income,
        'spending', expend,
        'financialYear', JSON_OBJECT(
          'begin', fystart,
          'end', fyend
        )
      )
    ) as finances`),
  ])
  .from(TABLE_FINANCIAL)
  .groupBy('regno')

log.info(query.toString())

const parser = x => {
  if (!x.id || !x.finances) return null
  // Sort finances by descending financial year
  x.finances.sort((a, b) => new Date(b.financialYear.end) - new Date(a.financialYear.end))
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
