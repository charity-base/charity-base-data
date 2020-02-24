require('dotenv').config()
const fetch = require('node-fetch')
const streamBatchPromise = require('stream-batch-promise')
const cheerio = require('cheerio')
const getProgressBar = require('./lib/progress')
const log = require('./lib/logger')

const {
  CC_BETA_URL,
  BATCH_SIZE,
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  TABLE_MAIN_CHARITY,
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

const betaUrl = id => `${CC_BETA_URL}?regId=${id}&subId=0`

const scrape = async id => {
  try {
    const res = await fetch(betaUrl(id))
    const html = await res.text()
    const $ = cheerio.load(html)
    const activities = $('div.row div.pcg-charity-details__block.col-12 p', '#overview').text() || null
    const peopleItems = $('div.row div.col-lg-3 ul.pcg-charity-details__stats li.pcg-charity-details__fact', '#people')
    const peopleCount = $('span.pcg-charity-details__amount--people', peopleItems).toArray().map(x => parseInt($(x).text().trim().replace(/,/g, ''))) || []
    const peopleTitles = $('span.pcg-charity-details__purpose', peopleItems).toArray().map(x => $(x).text().toLowerCase()) || []
    const people = peopleTitles.reduce((agg, x, i) => ({ ...agg, [x]: peopleCount[i]}), {})
    return {
      id,
      activities,
      people,
    }
  } catch(e) {
    log.error(e)
    return { id: null }
  }
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

const update = arr => {
  return new Promise((resolve, reject) => {
    knex.transaction(trx => {
      const updateQueries = arr
        .map(({ id, activities, people }) => (
          knex(TABLE_MAIN_CHARITY)
            .where('regno', '=', id)
            .update({ activities, people: JSON.stringify(people) })
            .transacting(trx)
        ))
      return Promise.all(updateQueries)
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
      const dataArr = await Promise.all(items.map(x => timebox(scrape(x.regno), 'scrape beta')))
      await update(dataArr.filter(x => x.id))
      resolve()
    } catch(e) {
      reject(e)
    }
  })
}

const f = async () => {
  try {
    const countQuery = knex(TABLE_MAIN_CHARITY).count('regno', { as: 'numCharities' })

    const { numCharities } = (await countQuery)[0]

    PROGRESS_BAR.start(numCharities, 0)

    const charitiesToUpdate = knex
      .select(
        `${TABLE_MAIN_CHARITY}.regno`,
      )
      .from(TABLE_MAIN_CHARITY)
      .where({
        [`${TABLE_MAIN_CHARITY}.activities`]: null,
        [`${TABLE_MAIN_CHARITY}.people`]: null,
      })

    log.info(`Importing data into '${TABLE_MAIN_CHARITY}' from CC beta site`)

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
