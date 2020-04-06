require('dotenv').config()
const streamBatchPromise = require('stream-batch-promise')
const getProgressBar = require('../lib/progress')
const log = require('../lib/logger')
const titleCase = require('../lib/title-case')
const knex = require('../knex-connection')
const UPPER_TERMS = require('../charity-name-acronyms')

const {
  BATCH_SIZE,
  TABLE_CHARITY_JSON,
  TABLE_CHARITY,
  TABLE_MAIN_CHARITY,
} = process.env

const PROGRESS_BAR = getProgressBar('Progress')

const orgIds = (chcId, cohId) => {
  const ids = [{
    id: `GB-CHC-${chcId}`,
    scheme: 'GB-CHC',
    rawId: chcId,
  }]
  if (cohId) {
    ids.push({
      id: `GB-COH-${cohId}`,
      scheme: 'GB-COH',
      rawId: cohId,
    })
  }
  return ids
}

const parser = x => {
  if (!x.chcId) return null

  const {
    chcId,
    cohId,
    primaryName,
    activities,
    address,
    email,
    phone,
    postcode,
    numPeople,
    areaOfBenefit,
    financialYearEnd,
    governingDoc,
    website,
    trustees,
  } = x

  return {
    chcId,
    cohId,
    orgIds: JSON.stringify(orgIds(chcId, cohId)),
    primaryName: titleCase(primaryName, UPPER_TERMS),
    activities,
    contact: JSON.stringify({
      address: address.filter(x => x).map(x => titleCase(x)),
      email,
      phone,
      postcode,
      social: [],
    }),
    numPeople: JSON.stringify(numPeople),
    areaOfBenefit: titleCase(areaOfBenefit),
    financialYearEnd,
    governingDoc,
    website,
    trustees: JSON.stringify(trustees),
  }
}

const update = async arr => {
  const insertQueries = arr
    .map(doc => (
      knex(TABLE_CHARITY_JSON)
        .insert(doc)
    ))
  if (insertQueries.length === 0) {
    return
  }
  const transaction = knex.transaction(trx => {
    return Promise.all(insertQueries.map(x => x.transacting(trx)))
      .then(trx.commit)
      .catch(trx.rollback)
  })
  return transaction
}

const batchHandler = (items, counter) => {
  return new Promise(async (resolve, reject) => {
    try {
      const docs = items.map(parser).filter(x => x)
      await update(docs)
      PROGRESS_BAR.update(counter)
      resolve()
    } catch(e) {
      reject(e)
    }
  })
}

const f = async () => {
  try {
    log.info(`Persisting data from '${TABLE_CHARITY}' & '${TABLE_MAIN_CHARITY}' to '${TABLE_CHARITY_JSON}'`)

    const countQuery = knex(TABLE_MAIN_CHARITY)
      .count('*', { as: 'numCharities' })

    const { numCharities } = (await countQuery)[0]

    const query = knex
      .select([
        'c.regno as chcId',
        knex.raw(`LPAD(mc.coyno, 8, '0') as cohId`),
        'c.name as primaryName',
        'c.gd as governingDoc',
        'c.aob as areaOfBenefit',
        'c.postcode as postcode',
        'c.phone as phone',
        knex.raw(`JSON_ARRAY(c.add1, c.add2, c.add3, c.add4, c.add5) as address`),
        'mc.web as website',
        'mc.email as email',
        'mc.fyend as financialYearEnd',
        'mc.activities as activities',
        'mc.people as numPeople',
        'mc.trustee_objects as trustees',
      ])
      .from(`${TABLE_CHARITY} as c`)
      .join(`${TABLE_MAIN_CHARITY} as mc`, 'mc.regno', '=', 'c.regno')
      .where('c.subno', '=', '0')
      .where('c.orgtype', '=', 'R')

    const queryStream = query.stream()
    queryStream.on('error', err => {
      log.error('Query stream error')
      log.error(err)
      throw err
    })

    PROGRESS_BAR.start(numCharities, 0)
    const total = await streamBatchPromise(
      queryStream,
      batchHandler,
      {
        batchSize: BATCH_SIZE,
      }
    )
    PROGRESS_BAR.update(total)
    PROGRESS_BAR.stop()
    log.info(`Successfully streamed through ${total} items`)
    await knex.destroy()
  } catch(e) {
    log.error(e)
    process.exit()
  }
}

f()
