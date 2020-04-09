const TABLE_CHARITY = 'cc_extract_charity'
const TABLE_CHARITY_TOPIC = 'charity_topic'
const TABLE_TOPIC = 'topic'

exports.up = async function (knex) {
  await knex.schema.createTable(TABLE_TOPIC, table => {
    table.string('id').primary()
    table.string('tokens', 255)
  })

  await knex.schema.createTable(TABLE_CHARITY_TOPIC, table => {
    table.string('regno', 10)
    table.string('topic_id')
    table.decimal('score', 4, 3)    
    table.foreign('regno').references(`${TABLE_CHARITY}.regno`)
    table.foreign('topic_id').references(`${TABLE_TOPIC}.id`)
    table.primary(['regno', 'topic_id'])
    table.index('score')
    table.index('topic_id')
  })
}

exports.down = async function(knex) {
  await knex.schema.dropTable(TABLE_CHARITY_TOPIC)
  await knex.schema.dropTable(TABLE_TOPIC)
}
