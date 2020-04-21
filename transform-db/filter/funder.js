require('dotenv').config()
const streamBatchPromise = require('stream-batch-promise')
const getProgressBar = require('../lib/progress')
const log = require('../lib/logger')
const clean = require('../lib/ngram-case')
const knex = require('../knex-connection')

const {
  BATCH_SIZE,
  TABLE_FILTER_JSON,
  TABLE_GRANTNAV,
} = process.env

const PROGRESS_BAR = getProgressBar('Progress')

const parser = x => {
  // Sort funder names by most recent grant awarded
  // So e.g. "The National Lottery Community Fund" comes before "The Big Lottery Fund"
  const funderNames = x.funderNames.sort((a, b) => new Date(b.latestDate) - new Date(a.latestDate))

  return {
    id: `funder-${x.funderId}`,
    value: x.funderId,
    label: funderNames[0].name,
    filterType: 'funder',
    suggest: JSON.stringify(funderNames.map(({ name }) => clean(name))),
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
    log.info(`Persisting data from '${TABLE_GRANTNAV}' to '${TABLE_FILTER_JSON}'`)

    const countQuery = knex(TABLE_GRANTNAV)
      .countDistinct('funder_id as numFilters')
      .whereNotNull('funder_name')
      // .innerJoin(`${TABLE_MAIN_CHARITY} as mc`, 'mc.regno', '=', 'g.recipient_charity_number')

    const { numFilters } = (await countQuery)[0]

    const query = knex
      .select([
        'funder_id as funderId',
        knex.raw(`JSON_ARRAYAGG(
          JSON_OBJECT(
            'name', funder_name,
            'latestDate', latest_date
          )
        ) as funderNames`),
      ])
      .from(function() {
        this
          .select([
            'funder_id',
            'funder_name',
            knex.raw(`MAX(date_awarded) as latest_date`),
          ])
          .from(TABLE_GRANTNAV)
          .whereNotNull('funder_name')
          .groupBy(['funder_id', 'funder_name'])
          .as('t1')
      })
      .groupBy('funder_id')

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
