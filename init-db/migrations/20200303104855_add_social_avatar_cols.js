const TABLE_SOCIAL = 'social'

exports.up = async function(knex) {
  await knex.schema.alterTable(TABLE_SOCIAL, table => {
    table.string('avatar_bucket', 50)
    table.string('avatar_small', 100)
    table.string('avatar_medium', 100)
    table.string('avatar_large', 100)
  })
}

exports.down = async function(knex) {
  await knex.schema.alterTable(TABLE_SOCIAL, table => {
    table.dropColumn('avatar_large')
    table.dropColumn('avatar_medium')
    table.dropColumn('avatar_small')
    table.dropColumn('avatar_bucket')
  })
}
