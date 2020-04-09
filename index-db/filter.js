require('dotenv').config()
const streamBatchPromise = require('stream-batch-promise')
const getProgressBar = require('./lib/progress')
const log = require('./lib/logger')
const client = require('./elastic-client')
const knex = require('./knex-client')
const mappings = require('./elastic-mappings-filter')
const settings = require('./elastic-settings-filter')

const {
  BATCH_SIZE,
  DB_NAME,
  TABLE_FILTER_JSON,
  CHARITY_BASE_ES_AWS_INDEX_FILTER,
  CHARITY_BASE_ES_AWS_DOC_TYPE,
} = process.env

const PROGRESS_BAR = getProgressBar('Progress')

const batchHandler = async (docs, counter) => {
  const body = docs.reduce((agg, doc) => [
    ...agg,
    {
      index: {
        _index: CHARITY_BASE_ES_AWS_INDEX_FILTER,
        _type: CHARITY_BASE_ES_AWS_DOC_TYPE,
        _id: doc.chcId,
      }
    },
    doc
  ], [])

  const { body: bulkResponse } = await client.bulk({ refresh: true, body })

  if (bulkResponse.errors) {
    const erroredDocuments = []
    bulkResponse.items.forEach((action, i) => {
      const operation = Object.keys(action)[0]
      if (action[operation].error) {
        erroredDocuments.push({
          status: action[operation].status,
          error: action[operation].error,
          operation: body[i * 2],
          document: body[i * 2 + 1]
        })
      }
    })
    throw JSON.stringify(erroredDocuments)
  }

  PROGRESS_BAR.update(counter)
  return
}

const f = async () => {
  try {
    log.info(`Uploading data from 'MySQL:${DB_NAME}.${TABLE_FILTER_JSON}' to 'Elasticsearch:${CHARITY_BASE_ES_AWS_INDEX_FILTER}'`)

    await client.indices.create({
      index: CHARITY_BASE_ES_AWS_INDEX_FILTER,
      body: { mappings, settings }
    })

    const countQuery = knex(TABLE_FILTER_JSON)
      .count('*', { as: 'numFilters' })

    const { numFilters } = (await countQuery)[0]

    const query = knex(TABLE_FILTER_JSON).select('*')

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
