const TABLE_ACCT_SUBMIT = 'cc_extract_acct_submit'
const TABLE_AOO_REF = 'cc_extract_aoo_ref'
const TABLE_AR_SUBMIT = 'cc_extract_ar_submit'
const TABLE_CHARITY = 'cc_extract_charity'
const TABLE_CHARITY_AOO = 'cc_extract_charity_aoo'
const TABLE_CLASS = 'cc_extract_class'
const TABLE_CLASS_REF = 'cc_extract_class_ref'
const TABLE_FINANCIAL = 'cc_extract_financial'
const TABLE_MAIN_CHARITY = 'cc_extract_main_charity'
const TABLE_NAME = 'cc_extract_name'
const TABLE_OBJECTS = 'cc_extract_objects'
const TABLE_PARTB = 'cc_extract_partb'
const TABLE_REGISTRATION = 'cc_extract_registration'
const TABLE_REMOVE_REF = 'cc_extract_remove_ref'
const TABLE_TRUSTEE = 'cc_extract_trustee'


exports.up = async function (knex) {
  await knex.schema.createTable(TABLE_CHARITY, table => {
    table.string('regno', 10)
    table.string('subno', 4)
    table.string('name', 150)
    table.string('orgtype', 10)
    table.text('gd')
    table.string('aob', 255)
    table.integer('aob_defined')
    table.string('nhs', 1).notNullable()
    table.integer('ha_no')
    table.string('corr', 255)
    table.string('add1', 35)
    table.string('add2', 35)
    table.string('add3', 35)
    table.string('add4', 35)
    table.string('add5', 35)
    table.string('postcode', 10)
    table.string('phone', 400)
    table.integer('fax')
    table.primary(['regno', 'subno'])
    table.index('postcode')
  })

  await knex.schema.createTable(TABLE_MAIN_CHARITY, table => {
    table.string('regno', 10).primary()
    table.string('coyno', 50)
    table.string('trustees', 1).notNullable()
    table.string('fyend', 4)
    table.string('welsh', 1).notNullable()
    table.datetime('incomedate', 1)
    table.integer('income')
    table.string('grouptype', 3)
    table.string('email', 400)
    table.string('web', 400)
    table.foreign('regno').references(`${TABLE_CHARITY}.regno`)
  })

  await knex.schema.createTable(TABLE_ACCT_SUBMIT, table => {
    table.string('regno', 10)
    table.datetime('submit_date')
    table.string('arno', 4).notNullable()
    table.string('fyend', 4)
    table.foreign('regno').references(`${TABLE_CHARITY}.regno`)
  })

  await knex.schema.createTable(TABLE_AOO_REF, table => {
    table.string('aootype', 10)
    table.integer('aookey')
    table.string('aooname', 255).notNullable()
    table.string('aoosort', 100).notNullable()
    table.string('welsh', 1).notNullable()
    table.integer('master')
    table.primary(['aootype', 'aookey'])
  })

  await knex.schema.createTable(TABLE_AR_SUBMIT, table => {
    table.string('regno', 10).notNullable() // actually NULL in cc build scripts
    table.string('arno', 4).notNullable()
    table.datetime('submit_date').notNullable() // actually NULL in cc build scripts
    table.foreign('regno').references(`${TABLE_CHARITY}.regno`)
  })

  await knex.schema.createTable(TABLE_CHARITY_AOO, table => {
    table.string('regno', 10).notNullable() // actually NULL in cc build scripts
    table.string('aootype', 10).notNullable() // actually NULL in cc build scripts
    table.integer('aookey').notNullable() // actually NULL in cc build scripts
    table.string('welsh', 1).notNullable() // actually NULL in cc build scripts
    table.integer('master')
    table.primary(['regno', 'aootype', 'aookey'])
    table.foreign('regno').references(`${TABLE_CHARITY}.regno`)
    table.foreign(['aootype', 'aookey']).references([`${TABLE_AOO_REF}.aootype`, `${TABLE_AOO_REF}.aookey`])
    // table.foreign('aookey').references(`${TABLE_AOO_REF}.aookey`)
  })

  await knex.schema.createTable(TABLE_CLASS_REF, table => {
    table.string('classno', 10).primary()
    table.string('classtext', 65).notNullable() // actually NULL in cc build scripts
  })

  await knex.schema.createTable(TABLE_CLASS, table => {
    table.string('regno', 10)
    table.string('class', 10)
    table.primary(['regno', 'class'])
    table.foreign('regno').references(`${TABLE_CHARITY}.regno`)
    table.foreign('class').references(`${TABLE_CLASS_REF}.classno`)
  })

  await knex.schema.createTable(TABLE_FINANCIAL, table => {
    table.string('regno', 10)
    table.datetime('fystart')
    table.datetime('fyend')
    table.integer('income')
    table.integer('expend')
    table.primary(['regno', 'fystart'])
  })

  await knex.schema.createTable(TABLE_NAME, table => {
    table.string('regno', 10)
    table.string('subno', 4)
    table.integer('nameno')
    table.string('name', 255).notNullable() // actually NULL in cc build scripts
    table.foreign('regno').references(`${TABLE_CHARITY}.regno`)
    table.primary(['regno', 'subno', 'nameno'])
  })

  await knex.schema.createTable(TABLE_OBJECTS, table => {
    table.string('regno', 10)
    table.string('subno', 4)
    table.string('seqno', 4)
    table.text('object').notNullable() // actually NULL in cc build scripts
    table.foreign('regno').references(`${TABLE_CHARITY}.regno`)
    table.primary(['regno', 'subno', 'seqno'])
  })

  await knex.schema.createTable(TABLE_PARTB, table => {
    table.string('regno', 10).notNullable() // actually NULL in cc build scripts
    table.string('artype', 4).notNullable()
    table.datetime('fystart').notNullable()
    table.datetime('fyend').notNullable()
    table.text('inc_leg')
    table.text('inc_end')
    table.text('inc_vol')
    table.text('inc_fr')
    table.text('inc_char')
    table.text('inc_invest')
    table.text('inc_other')
    table.text('inc_total')
    table.text('invest_gain')
    table.text('asset_gain')
    table.text('pension_gain')
    table.text('exp_vol')
    table.text('exp_trade')
    table.text('exp_invest')
    table.text('exp_grant')
    table.text('exp_charble')
    table.text('exp_gov')
    table.text('exp_other')
    table.text('exp_total')
    table.text('exp_support')
    table.text('exp_dep')
    table.text('reserves')
    table.text('asset_open')
    table.text('asset_close')
    table.text('fixed_assets')
    table.text('open_assets')
    table.text('invest_assets')
    table.text('cash_assets')
    table.text('current_assets')
    table.text('credit_1')
    table.text('credit_long')
    table.text('pension_assets')
    table.text('total_assets')
    table.text('funds_end')
    table.text('funds_restrict')
    table.text('funds_unrestrict')
    table.text('funds_total')
    table.text('employees')
    table.text('volunteers')
    table.text('cons_acc')
    table.text('charity_acc')
    table.foreign('regno').references(`${TABLE_CHARITY}.regno`)
  })

  await knex.schema.createTable(TABLE_REMOVE_REF, table => {
    table.string('code', 3).primary()
    table.string('text', 25).notNullable() // actually NULL in cc build scripts
  })

  await knex.schema.createTable(TABLE_REGISTRATION, table => {
    table.string('regno', 10)
    table.string('subno', 4)
    table.datetime('regdate')
    table.datetime('remdate')
    table.string('remcode', 3)
    table.primary(['regno', 'subno', 'regdate'])
    table.foreign('regno').references(`${TABLE_CHARITY}.regno`)
    table.foreign('remcode').references(`${TABLE_REMOVE_REF}.code`)
  })

  await knex.schema.createTable(TABLE_TRUSTEE, table => {
    table.string('regno', 10).notNullable() // actually NULL in cc build scripts
    table.string('trustee', 255).notNullable() // actually NULL in cc build scripts
    table.foreign('regno').references(`${TABLE_CHARITY}.regno`)
  })
}

exports.down = async function(knex) {
  await knex.schema.dropTable(TABLE_TRUSTEE)
  await knex.schema.dropTable(TABLE_REGISTRATION)
  await knex.schema.dropTable(TABLE_REMOVE_REF)
  await knex.schema.dropTable(TABLE_PARTB)
  await knex.schema.dropTable(TABLE_OBJECTS)
  await knex.schema.dropTable(TABLE_NAME)
  await knex.schema.dropTable(TABLE_FINANCIAL)
  await knex.schema.dropTable(TABLE_CLASS)
  await knex.schema.dropTable(TABLE_CLASS_REF)
  await knex.schema.dropTable(TABLE_CHARITY_AOO)
  await knex.schema.dropTable(TABLE_AR_SUBMIT)
  await knex.schema.dropTable(TABLE_AOO_REF)
  await knex.schema.dropTable(TABLE_ACCT_SUBMIT)
  await knex.schema.dropTable(TABLE_MAIN_CHARITY)
  await knex.schema.dropTable(TABLE_CHARITY)
}
