require('dotenv').config()
const fs = require('fs')
const log = require('./lib/logger')
const { pipeline } = require('stream')
const knex = require('./knex-connection')
const createTransformer = require('./create-transformer')

const {
  TABLE_NAME,
  JSON_DATA_DIR,
} = process.env

const FILENAME = 'name.json'

const query = knex
  .select([
    `regno as id`,
    knex.raw(`JSON_ARRAYAGG(
      JSON_OBJECT(
        'id', nameno,
        'name', name
      )
    ) as names`),
  ])
  .from(TABLE_NAME)
  .groupBy('regno')

log.info(query.toString())

const parser = x => {
  if (!x.id || !x.names) return null
  // Sort names by descending nameno
  x.names.sort((a, b) => b.id - a.id)
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
