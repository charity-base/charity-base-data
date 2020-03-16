require('dotenv').config()
const log = require('./lib/logger')
const { trainTopics } = require('mallet-topics')

const {
  MALLET_EXECUTABLE,
  MALLET_DATA_DIR,
  MALLET_NUM_TOPICS,
  MALLET_NUM_ITERATIONS,
  MALLET_OPTIMIZE_INTERVAL,
} = process.env

const INPUT_FILE_MALLET = 'input.mallet'
const TOPIC_FILE = 'topics.tsv'
const DOC_TOPIC_FILE = 'doc_topics.tsv'
const OUT_FILE = 'output_state.gz'

const filePath = fileName => {
  return [__dirname, MALLET_DATA_DIR, fileName].join('/')
}

const f = async () => {
  try {
    log.info(`Generating topics, could take a minute...`)

    await trainTopics(
      MALLET_EXECUTABLE,
      filePath(INPUT_FILE_MALLET),
      {
        "topicKeysFile": filePath(TOPIC_FILE),
        "docTopicsFile": filePath(DOC_TOPIC_FILE),
        "outputState": filePath(OUT_FILE),
        "numTopics": parseInt(MALLET_NUM_TOPICS),
        "numIterations": parseInt(MALLET_NUM_ITERATIONS),
        "optimizeInterval": parseInt(MALLET_OPTIMIZE_INTERVAL),
        onStdData: (stdType, msg) => log.info(msg.toString()),
      }
    )
  } catch(e) {
    log.error(e)
    process.exit()
  }
}

f()
