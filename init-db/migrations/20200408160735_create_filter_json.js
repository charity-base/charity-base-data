const TABLE_FILTER_JSON = 'filter_json'

exports.up = async function (knex) {
  await knex.schema.createTable(TABLE_FILTER_JSON, table => {
    table.string('id').primary()

    table.string('value')
    table.string('label')
    table.string('filterType')

    table.json('suggest')
  })
}

exports.down = async function(knex) {
  await knex.schema.dropTable(TABLE_FILTER_JSON)
}
