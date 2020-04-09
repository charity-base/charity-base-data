require('dotenv').config()
const streamBatchPromise = require('stream-batch-promise')
const getProgressBar = require('../lib/progress')
const log = require('../lib/logger')
const clean = require('../lib/clean-filter-suggest')
const knex = require('../knex-connection')

const {
  BATCH_SIZE,
  TABLE_FILTER_JSON,
  TABLE_TOPIC,
} = process.env

const PROGRESS_BAR = getProgressBar('Progress')

const parser = x => {
  return {
    id: `topic-${x.value}`,
    value: x.value,
    label: x.label,
    filterType: 'topic',
    suggest: JSON.stringify([clean(x.label)]),
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
    log.info(`Persisting data from '${TABLE_TOPIC}' to '${TABLE_FILTER_JSON}'`)

    const countQuery = knex(TABLE_TOPIC)
      .count('*', { as: 'numFilters' })

    const { numFilters } = (await countQuery)[0]

    const query = knex
      .select([
        'id as value',
        'tokens as label',
      ])
      .from(TABLE_TOPIC)

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
