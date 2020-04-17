const TABLE_MAIN_CHARITY = 'cc_extract_main_charity'

exports.up = async function(knex) {
  await knex.schema.alterTable(TABLE_MAIN_CHARITY, table => {
    table.text('activities')
    table.json('people')
    // todo: index these cols to speed up import-cc-beta?
  })
}

exports.down = async function(knex) {
  await knex.schema.alterTable(TABLE_MAIN_CHARITY, table => {
    table.dropColumn('people')
    table.dropColumn('activities')
  })
}
