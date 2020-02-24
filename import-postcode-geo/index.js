require('dotenv').config()
const fetch = require('node-fetch')
const streamBatchPromise = require('stream-batch-promise')
const getProgressBar = require('./lib/progress')
const log = require('./lib/logger')
const QUERY = require('./gql')

const {
  API_URL,
  BATCH_SIZE,
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  TABLE_MAIN_CHARITY,
  TABLE_CHARITY,
  TABLE_POSTCODE_GEO,
} = process.env

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

const fetchPostcode = postcode => {
  const variables = `{ "value": "${postcode}" }`
  return fetch(`${API_URL}?query=${QUERY}&variables=${variables}`)
    .then(res => res.json())
    .then(({ data, errors }) => {
      if (errors) {
        log.error('QUERY ERRORS: ', errors)
        return null
      }
      return data
    })
    .catch(err => {
      log.error('UNEXPECTED ERROR: ', err)
      return null
    })
}

const timebox = (promise, name, shouldReject=false, ms=5000) => {
  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      const msg = `Promise '${name}' timed out after ${ms}ms`
      log.error(msg)
      shouldReject ? reject(new Error(msg)) : resolve(null)
    }, ms)
    try {
      const res = await promise
      clearTimeout(timeout)
      resolve(res)
    }
    catch(e) {
      clearTimeout(timeout)
      reject(e)
    }
  })
}

const updatePostcodes = arr => {
  return new Promise((resolve, reject) => {
    knex.transaction(trx => {
      const updateQueries = arr
        .filter(({ postcodeGeo, ccPostcode }) => postcodeGeo && (postcodeGeo.id !== ccPostcode))
        .map(({ regno, postcodeGeo, ccPostcode }) => (
          knex(TABLE_CHARITY)
            .where('regno', '=', regno)
            .where('subno', '=', '0')
            .update({ postcode: postcodeGeo.id })
            .transacting(trx)
        ))
      const insertQueries = arr
        .filter(({ postcodeGeo }) => postcodeGeo)
        .map(({ regno, postcodeGeo }) => (
          knex.raw(
            knex(TABLE_POSTCODE_GEO)
            .insert({
              id: postcodeGeo.id,
              postcode_geo: JSON.stringify(postcodeGeo),
            })
            .toString()
            .replace('insert', 'insert ignore')
          )
          .transacting(trx)
        ))
      return Promise.all([...updateQueries, ...insertQueries])
        .then(trx.commit)    
        .catch(trx.rollback)
    })
    .then(updates => {
      resolve()
    })
    .catch(reject)
  })
}

const batchHandler = (items, counter) => {
  PROGRESS_BAR.update(counter)
  return new Promise(async (resolve, reject) => {
    try {
      const dataArr = await Promise.all(items.map(x => timebox(fetchPostcode(x.postcode), 'fetch postcode')))
      const charityPostcodes = dataArr.map((x, i) => ({
        regno: items[i].regno,
        postcodeGeo: x ? x.postcodes.get : null,
        ccPostcode: items[i].postcode,
      }))
      await updatePostcodes(charityPostcodes)
      resolve()
    } catch(e) {
      reject(e)
    }
  })
}

const f = async () => {
  try {
    log.info(`Setting ${TABLE_CHARITY}.postcode to uppercase`)
    await knex.raw(`UPDATE ${TABLE_CHARITY} SET postcode = UCASE(postcode);`)

    const countQuery = knex(TABLE_CHARITY)
      .leftJoin(TABLE_POSTCODE_GEO, `${TABLE_CHARITY}.postcode`, '=', `${TABLE_POSTCODE_GEO}.id`)
      .where({
        [`${TABLE_CHARITY}.subno`]: '0',
        [`${TABLE_CHARITY}.orgtype`]: 'R',
        [`${TABLE_POSTCODE_GEO}.id`]: null,
      })
      .count('regno', { as: 'numCharities' })

    const { numCharities } = (await countQuery)[0]

    PROGRESS_BAR.start(numCharities, 0)

    const charitiesToUpdate = knex
      .select(
        `${TABLE_CHARITY}.regno`,
        `${TABLE_CHARITY}.subno`,
        `${TABLE_CHARITY}.postcode`
      )
      .from(TABLE_CHARITY)
      .leftJoin(TABLE_POSTCODE_GEO, `${TABLE_CHARITY}.postcode`, '=', `${TABLE_POSTCODE_GEO}.id`)
      .where({
        [`${TABLE_CHARITY}.subno`]: '0',
        [`${TABLE_CHARITY}.orgtype`]: 'R',
        [`${TABLE_POSTCODE_GEO}.id`]: null,
      })

    log.info(`Cleaning postcode references in '${TABLE_CHARITY}' and inserting detailed geo info into '${TABLE_POSTCODE_GEO}'`)

    const total = await streamBatchPromise(
      charitiesToUpdate.stream(),
      batchHandler,
      {
        batchSize: BATCH_SIZE,
      }
    )
    PROGRESS_BAR.update(total)
    PROGRESS_BAR.stop()
    log.info(`Successfully searched for ${total} postcodes`)
    await knex.destroy()
  } catch(e) {
    log.error(e)
    process.exit()
  }
}

f()
