require('dotenv').config()
const log = require('./lib/logger')
const readline = require('readline')
const connection = require('./lib/db')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
}).on('close', () => {
  process.exit(0)
})

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

const dropDatabase = (conn, dbName) => {
  return runSQL(conn, `DROP DATABASE ${dbName}`)
}

const f = () => {
  const dbName = process.env.DB_NAME
  rl.question(`Are you sure you want to drop database '${dbName}? [y/N]' `, async (answer) => {
    try {
      if (answer && answer.toLowerCase() === 'y') {
        log.info(`Dropping database '${dbName}'`)
        await dropDatabase(connection, dbName)
      } else {
        log.info('Exiting down without dropping database')
      }
    } catch(e) {
      log.error(e.message)
    }
    connection.end()
    rl.close()
  })
}

f()
