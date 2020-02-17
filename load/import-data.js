require('dotenv').config()
const fs = require('fs')
const log = require('./lib/logger')
const connection = require('./lib/db')

const runSQL = (conn, sql) => {
  return new Promise((resolve, reject) => {
    const query = conn.query(sql, err => {
      if (err) {
        reject(err)
      }
      resolve(query.sql)
    })
  })
}

const importBCP = (conn, dbName, tableName, filePath) => {
  const sql = `
    LOAD DATA INFILE '${filePath}'
    IGNORE INTO TABLE ${dbName}.${tableName}
    CHARACTER SET latin1
    FIELDS
        TERMINATED BY '@**@'
        ESCAPED BY ''
    LINES
        TERMINATED BY '*@@*'
  `
  return runSQL(conn, sql)
}

const importData = async (conn, dbName, bcpDir) => {
  return new Promise((resolve, reject) => {
    fs.readdir(bcpDir, async (err, files) => {
      if (err) {
        reject(err)
      }
      for (let index = 0; index < files.length; index++) {
        log.info(`Importing data from '${files[index]}'`)
        const tableName = files[index].split('.')[0]
        await importBCP(
          conn,
          dbName,
          tableName,
          `${bcpDir}/${tableName}.bcp`
        )
      }
      resolve()
    })
  })
}

const f = async () => {
  try {
    const dbName = process.env.DB_NAME
    const dir = `${__dirname}/${process.env.CC_DOWNLOAD_DESTINATION}`
    await importData(connection, dbName, dir)
    connection.end()
  } catch(e) {
    log.error(e.message)
    process.exit(0)
  }
}

f()
