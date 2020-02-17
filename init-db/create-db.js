require('dotenv').config()
const log = require('./lib/logger')
const connection = require('./lib/db')
const createTableQueries = require('./sql')

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

const createTables = async (conn, dbName) => {
  for (let index = 0; index < createTableQueries.length; index++) {
    const { tableName, sql } = createTableQueries[index](dbName)
    log.info(`Creating table '${tableName}'`)
    await runSQL(conn, sql)
  }
}

const f = async () => {
  try {
    await createDatabase(connection, process.env.DB_NAME)
  } catch(e) {
    log.error(e.message)
    process.exit(0)
  }

  try {
    await createTables(connection, process.env.DB_NAME)
    connection.end()
  } catch(e) {
    log.error(e.message)
    log.info(`Dropping database '${process.env.DB_NAME}'`)
    await dropDatabase(connection, process.env.DB_NAME)
    process.exit(0)
  }
}

f()
