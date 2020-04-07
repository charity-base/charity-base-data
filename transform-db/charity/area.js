require('dotenv').config()
const streamBatchPromise = require('stream-batch-promise')
const getProgressBar = require('../lib/progress')
const log = require('../lib/logger')
const knex = require('../knex-connection')

const {
  BATCH_SIZE,
  TABLE_CHARITY_JSON,
  TABLE_MAIN_CHARITY,
  TABLE_AOO_REF,
  TABLE_CHARITY_AOO,
} = process.env

const PROGRESS_BAR = getProgressBar('Progress')

const parser = x => {
  if (!x.chcId || !x.areas) return null

  // sort by id
  const areas = x.areas.sort((a, b) => a.id > b.id ? 1 : -1)

  return {
    chcId: x.chcId,
    areas: JSON.stringify(areas),
  }
}

const update = async arr => {
  const updateQueries = arr
    .map(({ chcId, areas }) => (
      knex(TABLE_CHARITY_JSON)
        .where('chcId', '=', chcId)
        .update({ areas })
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
    log.info(`Persisting data from '${TABLE_CHARITY_AOO}' & '${TABLE_AOO_REF}' to '${TABLE_CHARITY_JSON}'`)

    const countQuery = knex(`${TABLE_CHARITY_AOO} as area`)
      .countDistinct('area.regno as numCharities')
      .innerJoin(`${TABLE_MAIN_CHARITY} as mc`, 'mc.regno', '=', 'area.regno')

    const { numCharities } = (await countQuery)[0]

    const query = knex
      .select([
        `area.regno as chcId`,
        knex.raw(`JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', CONCAT_WS(
              '-',
              TRIM(area.aootype),
              area.aookey
            ),
            'name', TRIM(areaRef.aooname)
          )
        ) as areas`),
      ])
      .from(`${TABLE_CHARITY_AOO} as area`)
      .innerJoin(`${TABLE_MAIN_CHARITY} as mc`, 'mc.regno', '=', 'area.regno')
      .innerJoin(`${TABLE_AOO_REF} as areaRef`, function() {
        this.on('areaRef.aootype', '=', 'area.aootype')
        .andOn('areaRef.aookey', '=', 'area.aookey')
      })
      .groupBy('area.regno')

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
