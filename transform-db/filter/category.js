require('dotenv').config()
const streamBatchPromise = require('stream-batch-promise')
const getProgressBar = require('../lib/progress')
const log = require('../lib/logger')
const clean = require('../lib/ngram-case')
const knex = require('../knex-connection')

const {
  BATCH_SIZE,
  TABLE_FILTER_JSON,
  TABLE_CLASS_REF,
} = process.env

const PROGRESS_BAR = getProgressBar('Progress')

const parser = x => {
  const intId = parseInt(x.value)

  let filterType
  if (intId < 200) {
    filterType = 'cause'
  } else if (intId >= 300) {
    filterType = 'operation'
  } else {
    filterType = 'beneficiary'
  }

  return {
    id: `${filterType}-${x.value}`,
    value: x.value,
    label: x.label,
    filterType: filterType,
    suggest: JSON.stringify(x.suggest.map(clean)),
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

const batchHandler = (items, counter) => {
  const docs = items.map(parser).filter(x => x)
  await update(docs)
  PROGRESS_BAR.update(counter)
  return
}

const f = async () => {
  try {
    log.info(`Persisting data from '${TABLE_CLASS_REF}' to '${TABLE_FILTER_JSON}'`)

    const countQuery = knex(TABLE_CLASS_REF)
      .count('*', { as: 'numFilters' })

    const { numFilters } = (await countQuery)[0]

    const query = knex
      .select([
        'classno as value',
        'classtext as label',
        knex.raw(`JSON_ARRAY(classtext) as suggest`),
      ])
      .from(TABLE_CLASS_REF)

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
