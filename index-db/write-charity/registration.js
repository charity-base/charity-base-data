require('dotenv').config()
const streamBatchPromise = require('stream-batch-promise')
const getProgressBar = require('../lib/progress')
const log = require('../lib/logger')
const knex = require('../knex-connection')

const {
  BATCH_SIZE,
  TABLE_CHARITY_JSON,
  TABLE_MAIN_CHARITY,
  TABLE_REGISTRATION,
  TABLE_REMOVE_REF,
} = process.env

const PROGRESS_BAR = getProgressBar('Progress')

const parser = x => {
  if (!x.chcId || !x.registrations) return null

  // Sort by reverse chronological
  const registrations = x.registrations.sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate))

  return {
    chcId: x.chcId,
    registrations: JSON.stringify(registrations),
    lastRegistrationDate: registrations[0].registrationDate,
  }
}

const update = async arr => {
  const updateQueries = arr
    .map(({ chcId, registrations, lastRegistrationDate }) => (
      knex(TABLE_CHARITY_JSON)
        .where('chcId', '=', chcId)
        .update({ registrations, lastRegistrationDate })
    ))
  if (updateQueries.length === 0) {
    return
  }
  const transaction = knex.transaction(trx => {
    return Promise.all(updateQueries.map(x => x.transacting(trx)))
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
    log.info(`Persisting data from '${TABLE_REGISTRATION}' & '${TABLE_REMOVE_REF}' to '${TABLE_CHARITY_JSON}'`)

    const countQuery = knex(`${TABLE_REGISTRATION} as r`)
      .countDistinct('r.regno as numCharities')
      .innerJoin(`${TABLE_MAIN_CHARITY} as mc`, 'mc.regno', '=', 'r.regno')
      .where('r.subno', '=', '0')

    const { numCharities } = (await countQuery)[0]

    const query = knex
      .select([
        `r.regno as chcId`,
        knex.raw(`JSON_ARRAYAGG(
          JSON_OBJECT(
            'registrationDate', r.regdate,
            'removalDate', r.remdate,
            'removalCode', TRIM(r.remcode),
            'removalReason', TRIM(rRef.text)
          )
        ) as registrations`),
      ])
      .from(`${TABLE_REGISTRATION} as r`)
      .innerJoin(`${TABLE_MAIN_CHARITY} as mc`, 'mc.regno', '=', 'r.regno')
      .leftJoin(`${TABLE_REMOVE_REF} as rRef`, 'rRef.code', '=', 'r.remcode')
      .where('r.subno', '=', '0')
      .groupBy('r.regno')

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
