const TABLE_MAIN_CHARITY = 'cc_extract_main_charity'

exports.up = async function(knex) {
  await knex.schema.alterTable(TABLE_MAIN_CHARITY, table => {
    table.json('trustee_objects')
  })
}

exports.down = async function(knex) {
  await knex.schema.alterTable(TABLE_MAIN_CHARITY, table => {
    table.dropColumn('trustee_objects')
  })
}
