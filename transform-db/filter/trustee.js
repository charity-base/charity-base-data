require('dotenv').config()
const streamBatchPromise = require('stream-batch-promise')
const getProgressBar = require('../lib/progress')
const log = require('../lib/logger')
const clean = require('../lib/clean-filter-suggest')
const knex = require('../knex-connection')

const {
  BATCH_SIZE,
  TABLE_FILTER_JSON,
  TABLE_MAIN_CHARITY,
} = process.env

const PROGRESS_BAR = getProgressBar('Progress')
const NAME_SEPARATOR = ' ---- '

const parser = x => {
  const trusteeNames = x.trusteeNamesString.split(NAME_SEPARATOR)
  return {
    id: `trustee-${x.trusteeId}`,
    value: x.trusteeId,
    label: trusteeNames[0],
    filterType: 'trustee',
    suggest: JSON.stringify(trusteeNames.map(clean)),
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
    log.info(`Persisting data from '${TABLE_MAIN_CHARITY}' to '${TABLE_FILTER_JSON}'`)

    const countQuery = knex.raw(`
      SELECT COUNT(DISTINCT(t.id)) as numFilters
      FROM ${TABLE_MAIN_CHARITY}, 
      JSON_TABLE(
        trustee_objects,
        '$[*]' COLUMNS (
          id INT PATH '$.id'
        )
      ) as t
      WHERE t.id > 0;
    `)

    const { numFilters } = (await countQuery)[0][0]

    const query = knex.raw(`
      SELECT
        id as trusteeId,
        GROUP_CONCAT(
          DISTINCT name
          ORDER BY income DESC
          SEPARATOR '${NAME_SEPARATOR}'
        ) as trusteeNamesString
      FROM
      (
        SELECT mc.income, t.id, t.name
        FROM ${TABLE_MAIN_CHARITY} as mc, 
        JSON_TABLE(
          trustee_objects,
          '$[*]' COLUMNS (
            id INT PATH '$.id',
            name VARCHAR(255) PATH '$.name'
          )
        ) as t
        WHERE t.id > 0
      ) as trustee_rows
      GROUP BY id
    `)

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
