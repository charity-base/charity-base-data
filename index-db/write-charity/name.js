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
  TABLE_MAIN_CHARITY,
  TABLE_NAME,
} = process.env

const PROGRESS_BAR = getProgressBar('Progress')

const parser = x => {
  if (!x.chcId || !x.names) return null
  // Sort names by descending nameno
  const names = x.names
    .sort((a, b) => b.id - a.id)
    .map(({ id, name }) => ({ id, name: titleCase(name, UPPER_TERMS) }))

  return {
    chcId: x.chcId,
    names: JSON.stringify(names)
  }
}

const update = async arr => {
  const updateQueries = arr
    .map(({ chcId, names }) => (
      knex(TABLE_CHARITY_JSON)
        .where('chcId', '=', chcId)
        .update({ names })
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
    log.info(`Persisting data from '${TABLE_NAME}' to '${TABLE_CHARITY_JSON}'`)

    const countQuery = knex(`${TABLE_NAME} as n`)
      .countDistinct('n.regno as numCharities')
      .innerJoin(`${TABLE_MAIN_CHARITY} as mc`, 'mc.regno', '=', 'n.regno')
      .where('n.subno', '=', '0')

    const { numCharities } = (await countQuery)[0]

    const query = knex
      .select([
        `n.regno as chcId`,
        knex.raw(`JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', n.nameno,
            'name', n.name
          )
        ) as names`),
      ])
      .from(`${TABLE_NAME} as n`)
      .innerJoin(`${TABLE_MAIN_CHARITY} as mc`, 'mc.regno', '=', 'n.regno')
      .where('n.subno', '=', '0')
      .groupBy('n.regno')

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
