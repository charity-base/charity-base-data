require('dotenv').config()
const log = require('./lib/logger')
const knexConfig = require('./knexfile')
const knex = require('knex')(knexConfig.development)

const TABLE_CHARITY = 'cc_extract_charity'
const TABLE_MAIN_CHARITY = 'cc_extract_main_charity'
const TABLE_ACCT_SUBMIT = 'cc_extract_acct_submit'
const TABLE_AOO_REF = 'cc_extract_aoo_ref'
const TABLE_AR_SUBMIT = 'cc_extract_ar_submit'
const TABLE_CHARITY_AOO = 'cc_extract_charity_aoo'
const TABLE_CLASS = 'cc_extract_class'
const TABLE_CLASS_REF = 'cc_extract_class_ref'
const TABLE_FINANCIAL = 'cc_extract_financial'
const TABLE_NAME = 'cc_extract_name'
const TABLE_OBJECTS = 'cc_extract_objects'
const TABLE_PARTB = 'cc_extract_partb'
const TABLE_REGISTRATION = 'cc_extract_registration'
const TABLE_REMOVE_REF = 'cc_extract_remove_ref'
const TABLE_TRUSTEE = 'cc_extract_trustee'

const colRef = i => `@col${i}`
const colVal = (ref, colName, { nullable, type }) => {
  let val = ref
  // Trim all string values
  if (['varchar', 'text'].includes(type)) {
    val = `TRIM(${val})`
  }
  // Sometimes cc_extract_registration.remcode is 'AD'
  // But this code is not defined in cc_extract_remove_ref
  if (colName === 'remcode') {
    val = `NULLIF(${val},'AD')`
  }
  // Since the .bcp values have no distinction between empty fields and null fields
  // We must decide which ones to nullify (otherwise it'll always try to insert empty string '')
  if (nullable) {
    val = `NULLIF(${val},'\0')`
    val = `NULLIF(${val},'\u0000')`
    val = `NULLIF(${val},'')`
  }
  return val
}

const importData = (dbName, bcpDir) => {
  return new Promise(async (resolve, reject) => {
    const orderedTables = [
      TABLE_CHARITY,
      TABLE_MAIN_CHARITY,
      TABLE_ACCT_SUBMIT,
      TABLE_AOO_REF,
      TABLE_AR_SUBMIT,
      TABLE_CHARITY_AOO,
      TABLE_CLASS_REF,
      TABLE_CLASS,
      TABLE_FINANCIAL,
      TABLE_NAME,
      TABLE_OBJECTS,
      TABLE_PARTB,
      TABLE_REMOVE_REF,
      TABLE_REGISTRATION,
      TABLE_TRUSTEE,
    ]

    for (let index = 0; index < orderedTables.length; index++) {
      const tableName = orderedTables[index]
      const fileName = tableName.split('cc_')[1] + '.bcp'
      log.info(`Importing data from '${fileName}'`)

      try {
        const colsObj = await knex(tableName).columnInfo()
        const colsArr = Object.keys(colsObj)
        const refs = colsArr.map((_, i) => colRef(i)).join(',')
        const set = colsArr.map((colName, i) => {
          return `${colName}=${colVal(colRef(i), colName, colsObj[colName])}`
        }).join(',')

        const sql = `
          LOAD DATA
            INFILE '${bcpDir}/${fileName}'
            REPLACE
            INTO TABLE ${dbName}.${tableName}
            CHARACTER SET latin1
            FIELDS
              TERMINATED BY '@**@'
            LINES
              TERMINATED BY '*@@*'
            (${refs})
            SET ${set};
        `
        await knex.raw(sql)
      } catch(e) {
        return reject(e)
      }
    }
    resolve()
  })
}

const f = async () => {
  try {
    const dbName = process.env.DB_NAME
    const dir = `${__dirname}/${process.env.CC_DOWNLOAD_DESTINATION}`
    await importData(dbName, dir)
    log.info(`Successfully imported CC data to database '${dbName}'`)
    await knex.destroy()
  } catch(e) {
    log.error(e.message)
    process.exit(0)
  }
}

f()
