require('dotenv').config()
const streamBatchPromise = require('stream-batch-promise')
const getProgressBar = require('./lib/progress')
const log = require('./lib/logger')
const knex = require('./knex-connection')

const {
  BATCH_SIZE,
  TABLE_CHARITY_JSON,
  TABLE_GRANTNAV,
  TABLE_MAIN_CHARITY,
} = process.env

const PROGRESS_BAR = getProgressBar('Progress')

const parser = x => {
  if (!x.chcId || !x.grants) return null
  // Sort grants by descending award date
  const grantsList = x.grants.sort((a, b) => new Date(b.awardDate) - new Date(a.awardDate))
  const fundersDict = grantsList.reduce((agg, { fundingOrganization }) => agg[fundingOrganization.id] ? agg : ({
    ...agg,
    [fundingOrganization.id]: fundingOrganization.name
  }), {})
  const fundersList = Object.keys(fundersDict).map(id => ({ id, name: fundersDict[id] }))
  return {
    chcId: x.chcId,
    funding: JSON.stringify({
      grants: grantsList, // should we limit to 20 most recent?
      funders: fundersList,
      numGrants: grantsList.length,
      numFunders: fundersList.length,
    })
  }
}

const update = async arr => {
  const updateQueries = arr
    .map(({ chcId, funding }) => (
      knex(TABLE_CHARITY_JSON)
        .where('chcId', '=', chcId)
        .update({ funding })
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
    log.info(`Persisting data from '${TABLE_GRANTNAV}' to '${TABLE_CHARITY_JSON}'`)

    const countQuery = knex(`${TABLE_GRANTNAV} as g`)
      .innerJoin(`${TABLE_MAIN_CHARITY} as mc`, 'mc.regno', '=', 'g.recipient_charity_number')
      .countDistinct('recipient_charity_number as numCharities')

    const { numCharities } = (await countQuery)[0]

    const query = knex
      .select([
        `g.recipient_charity_number as chcId`,
        knex.raw(`JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', g.id,
            'title', g.title,
            'description', g.description,
            'amountAwarded', g.amount_awarded,
            'awardDate', g.date_awarded,
            'currency', g.currency,
            'fundingOrganization', JSON_OBJECT('id', g.funder_id, 'name', g.funder_name)
          )
        ) as grants`),
      ])
      .from(`${TABLE_GRANTNAV} as g`)
      .innerJoin(`${TABLE_MAIN_CHARITY} as mc`, 'mc.regno', '=', 'g.recipient_charity_number')
      .groupBy('recipient_charity_number')

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
