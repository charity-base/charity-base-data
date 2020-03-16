require('dotenv').config()
const getProgressBar = require('./lib/progress')
const log = require('./lib/logger')
const fs = require('fs')
const { Transform, pipeline } = require('stream')
const { importData } = require('mallet-topics')

const {
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  MALLET_EXECUTABLE,
  MALLET_DATA_DIR,
  STOPFILE,
  TABLE_GRANTNAV,
  TABLE_MAIN_CHARITY,
  MIN_INPUT_LENGTH,
  MAX_INPUT_LENGTH,
} = process.env

const INPUT_FILE_TXT = [__dirname, MALLET_DATA_DIR, 'input.txt'].join('/')
const INPUT_FILE_MALLET = [__dirname, MALLET_DATA_DIR, 'input.mallet'].join('/')

const jsonToMallet = new Transform({
  objectMode: true,
  transform({ regno, inputText }, encoding, callback) {
    const cleanText = inputText.replace(/[^a-zA-z]/g, ' ')
    const nonTrivial = cleanText.length > parseInt(MIN_INPUT_LENGTH) ? cleanText : ''
    this.push(`${regno} english ${nonTrivial}\n`)
    callback()
  }
})

const knex = require('knex')({
  client: 'mysql2',
  connection: {
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  },
  // debug: true,
})

const PROGRESS_BAR = getProgressBar('Progress')

const f = async () => {
  try {
    log.info(`Writing text from DB '${DB_NAME}' to directory '${MALLET_DATA_DIR}'`)

    try {
      await fs.promises.mkdir([__dirname, MALLET_DATA_DIR].join('/'), { recursive: true })
    } catch (e) {}

    const countQuery = knex(TABLE_MAIN_CHARITY)
      .count('regno', { as: 'numCharities' })

    const { numCharities } = (await countQuery)[0]

    PROGRESS_BAR.start(numCharities, 0)

    await knex.raw(`SET SESSION group_concat_max_len = ${MAX_INPUT_LENGTH};`)

    const charitiesToUpdate = knex
      .select(
        `${TABLE_MAIN_CHARITY}.regno`,
        knex.raw(`CONCAT_WS(
          ' ',
          ${TABLE_MAIN_CHARITY}.activities,
          GROUP_CONCAT(
            CONCAT_WS(
              ' ',
              ${TABLE_GRANTNAV}.title,
              ${TABLE_GRANTNAV}.description
            ) SEPARATOR ' '
          )
        ) AS inputText`),
      )
      .from(TABLE_MAIN_CHARITY)
      .leftJoin(TABLE_GRANTNAV, `${TABLE_MAIN_CHARITY}.regno`, '=', `${TABLE_GRANTNAV}.recipient_charity_number`)
      .groupBy(`${TABLE_MAIN_CHARITY}.regno`)

    let count = 0
    const writeStream = fs.createWriteStream(INPUT_FILE_TXT)
    
    jsonToMallet.on('data', () => {
      count ++
      if (count % 1000 === 0) {
        PROGRESS_BAR.update(count)
      }
    })

    await new Promise((resolve, reject) => {
      pipeline(
        charitiesToUpdate.stream(),
        jsonToMallet,
        writeStream,
        err => {
          if (err) {
            return reject(err)
          }
          PROGRESS_BAR.update(count)
          resolve()
        }
      )
    })

    PROGRESS_BAR.stop()
    await knex.destroy()

    log.info(`Converting input to MALLET data format, could take a minute...`)

    await importData(
      MALLET_EXECUTABLE,
      INPUT_FILE_TXT,
      {
        malletDataFile: INPUT_FILE_MALLET,
        stopFile: [__dirname, STOPFILE].join('/'),
        onStdData: (stdType, msg) => log.info(msg.toString()),
        singleFile: true,
      }
    )

  } catch(e) {
    log.error(e)
    process.exit()
  }
}

f()
