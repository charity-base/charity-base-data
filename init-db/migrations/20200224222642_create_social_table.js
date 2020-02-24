const TABLE_CHARITY = 'cc_extract_charity'
const TABLE_SOCIAL = 'social'

exports.up = async function (knex) {
  await knex.schema.createTable(TABLE_SOCIAL, table => {
    table.string('regno', 10).primary()
    table.string('twitter', 15)
    table.string('facebook', 50)
    table.foreign('regno').references(`${TABLE_CHARITY}.regno`)
  })
}

exports.down = async function(knex) {
  await knex.schema.dropTable(TABLE_SOCIAL)
}
