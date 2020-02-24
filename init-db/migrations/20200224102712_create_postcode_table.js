const TABLE_CHARITY = 'cc_extract_charity'
const TABLE_POSTCODE_GEO = 'postcode'

exports.up = async function (knex) {
  await knex.schema.createTable(TABLE_POSTCODE_GEO, table => {
    table.string('id', 10).primary()
    table.json('postcode_geo')
    table.foreign('id').references(`${TABLE_CHARITY}.postcode`)
  })
}

exports.down = async function(knex) {
  await knex.schema.dropTable(TABLE_POSTCODE_GEO)
}
