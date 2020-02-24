require('dotenv').config()
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

const createDatabase = (conn, dbName) => {
  log.info(`Creating database '${process.env.DB_NAME}'`)
  return runSQL(conn, `CREATE DATABASE ${dbName}`)
}

const f = async () => {
  try {
    await createDatabase(connection, process.env.DB_NAME)
    connection.end()
  } catch(e) {
    log.error(e.message)
    process.exit(0)
  }
}

f()
