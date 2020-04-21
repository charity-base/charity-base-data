require('dotenv').config()
const streamBatchPromise = require('stream-batch-promise')
const getProgressBar = require('../lib/progress')
const log = require('../lib/logger')
const clean = require('../lib/ngram-case')
const titleCase = require('../lib/title-case')
const knex = require('../knex-connection')
const UPPER_TERMS = require('../charity-name-acronyms')

const {
  BATCH_SIZE,
  TABLE_FILTER_JSON,
  TABLE_MAIN_CHARITY,
  TABLE_NAME,
} = process.env

const PROGRESS_BAR = getProgressBar('Progress')

const parser = x => {
  // Sort name by decreasing id (assumes more up-to-date names have higher ids)
  const names = x.names.sort((a, b) => b.id - a.id)

  return {
    id: `id-${x.chcId}`,
    value: x.chcId,
    label: titleCase(names[0].name, UPPER_TERMS), // not necessarily primaryName
    filterType: 'id',
    suggest: JSON.stringify([
      x.chcId,
      `GB-CHC-${x.chcId}`,
      ...names.map(({ name }) => clean(name)),
    ]),
  }
}

const update = async arr => {
  const updateQueries = arr
    .map((doc) => (
      knex(TABLE_FILTER_JSON)
        .insert(doc)
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

const batchHandler = async (items, counter) => {
  const docs = items.map(parser).filter(x => x)
  await update(docs)
  PROGRESS_BAR.update(counter)
  return
}

const f = async () => {
  try {
    log.info(`Persisting data from '${TABLE_NAME}' to '${TABLE_FILTER_JSON}'`)

    const countQuery = knex(`${TABLE_NAME} as n`)
      .countDistinct('n.regno as numFilters')
      .where('n.subno', '=', '0')
      .innerJoin(`${TABLE_MAIN_CHARITY} as mc`, 'mc.regno', '=', 'n.regno')

    const { numFilters } = (await countQuery)[0]

    const query = knex
      .select([
        'n.regno as chcId',
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

    PROGRESS_BAR.start(numFilters, 0)
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
