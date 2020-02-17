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

const tableName = fileName => {
  return `cc_${fileName.split('.')[0]}`
}

const importData = async (conn, dbName, bcpDir) => {
  return new Promise((resolve, reject) => {
    fs.readdir(bcpDir, async (err, files) => {
      if (err) {
        reject(err)
      }
      for (let index = 0; index < files.length; index++) {
        const fileName = files[index]
        log.info(`Importing data from '${fileName}'`)
        await importBCP(
          conn,
          dbName,
          tableName(fileName),
          `${bcpDir}/${fileName}`
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
