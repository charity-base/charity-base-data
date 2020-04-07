require('dotenv').config()
const streamBatchPromise = require('stream-batch-promise')
const getProgressBar = require('../lib/progress')
const log = require('../lib/logger')
const knex = require('../knex-connection')

const {
  BATCH_SIZE,
  TABLE_CHARITY_JSON,
  TABLE_MAIN_CHARITY,
  TABLE_CLASS_REF,
  TABLE_CLASS,
} = process.env

const PROGRESS_BAR = getProgressBar('Progress')

const parser = x => {
  if (!x.chcId || !x.categories) return null

  // sort by ascending id (subtraction works with number strings)
  const categories = x.categories.sort((a, b) => (a.id - b.id))
  const integerIds = categories.map(({ id }) => parseInt(id))

  return {
    chcId: x.chcId,
    causes: JSON.stringify(categories.filter((_, i) => (integerIds[i] < 200))),
    beneficiaries: JSON.stringify(categories.filter((_, i) => (integerIds[i] >= 200 && integerIds[i] < 300))),
    operations: JSON.stringify(categories.filter((_, i) => (integerIds[i] >= 300))),
  }
}

const update = async arr => {
  const updateQueries = arr
    .map(({ chcId, causes, beneficiaries, operations }) => (
      knex(TABLE_CHARITY_JSON)
        .where('chcId', '=', chcId)
        .update({ causes, beneficiaries, operations })
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
    log.info(`Persisting data from '${TABLE_CLASS}' & '${TABLE_CLASS_REF}' to '${TABLE_CHARITY_JSON}'`)

    const countQuery = knex(`${TABLE_CLASS} as class`)
      .countDistinct('class.regno as numCharities')
      .innerJoin(`${TABLE_MAIN_CHARITY} as mc`, 'mc.regno', '=', 'class.regno')

    const { numCharities } = (await countQuery)[0]

    const query = knex
      .select([
        `class.regno as chcId`,
        knex.raw(`JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', class.class,
            'name', classRef.classtext
          )
        ) as categories`),
      ])
      .from(`${TABLE_CLASS} as class`)
      .innerJoin(`${TABLE_MAIN_CHARITY} as mc`, 'mc.regno', '=', 'class.regno')
      .innerJoin(`${TABLE_CLASS_REF} as classRef`, 'classRef.classno', '=', 'class.class')
      .groupBy('class.regno')

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
