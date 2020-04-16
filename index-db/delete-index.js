const readline = require('readline')
const client = require('./lib/elastic-client')

const INDEX = process.argv[2]

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
}).on('close', () => {
  process.exit(0)
})

const f = () => {
  if (!INDEX) {
    console.log('Error: ', `Please provide an index name like this: 'yarn delete-index MY_INDEX_NAME'`)
    rl.close()
    return
  }
  rl.question(`Are you sure you want to delete index '${INDEX}'? [y/N] `, async (answer) => {
    try {
      if (answer && answer.toLowerCase() === 'y') {
        console.log(`Deleting index '${INDEX}'`)
        await client.indices.delete({
          index: INDEX,
        })
      } else {
        console.log('Exiting without deleting index')
      }
    } catch(e) {
      console.log('Error: ', e.message)
    }
    rl.close()
  })
}

f()
