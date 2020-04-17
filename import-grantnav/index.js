require('dotenv').config()
const log = require('./lib/logger')
const knexConfig = require('./knexfile')
const knex = require('knex')(knexConfig.development)

const {
  DB_NAME,
  TABLE_GRANTNAV,
  GRANTNAV_DOWNLOAD_DESTINATION,
  GRANTNAV_FILENAME,
} = process.env

const colRef = i => `@col${i}`
const colVal = (ref, colName, { nullable, type }) => {
  let val = ref
  // Trim all string values
  if (['varchar', 'text'].includes(type)) {
    val = `TRIM(${val})`
  }
  // Nullify empty values if possible
  if (nullable) {
    val = `NULLIF(${val},'\0')`
    val = `NULLIF(${val},'\u0000')`
    val = `NULLIF(${val},'')`
  }
  return val
}

const importData = async (dbName, tableName, filePath) => {
  log.info(`Importing data from '${filePath}'`)

  const columns = await knex.raw(`SHOW COLUMNS FROM ${tableName}`)
  const colsArr = columns[0].map(col => col.Field) // ensure order is same as when creating table

  const colsObj = await knex(tableName).columnInfo()

  const refs = colsArr.map((_, i) => colRef(i)).join(',')
  const set = colsArr.map((colName, i) => {
    return `${colName}=${colVal(colRef(i), colName, colsObj[colName])}`
  }).join(',')

  const sql = `
    LOAD DATA
      INFILE '${filePath}'
      IGNORE
      INTO TABLE ${dbName}.${tableName}
      FIELDS
        TERMINATED BY ','
        ENCLOSED BY '"'
      IGNORE 1 LINES
      (${refs})
      SET ${set};
  `
  return knex.raw(sql)
}

const f = async () => {
  try {
    const filePath = `${__dirname}/${GRANTNAV_DOWNLOAD_DESTINATION}/${GRANTNAV_FILENAME}`
    await importData(DB_NAME, TABLE_GRANTNAV, filePath)
    log.info(`Successfully imported GrantNav data to table '${DB_NAME}.${TABLE_GRANTNAV}'`)
    await knex.destroy()
  } catch(e) {
    log.error(e.message)
    process.exit(0)
  }
}

f()
