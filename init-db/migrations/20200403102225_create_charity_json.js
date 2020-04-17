const TABLE_CHARITY = 'cc_extract_charity'
const TABLE_CHARITY_JSON = 'charity_json'

exports.up = async function (knex) {
  await knex.schema.createTable(TABLE_CHARITY_JSON, table => {
    table.string('chcId', 10).primary()
    table.string('cohId', 50)

    table.string('primaryName', 150)
    table.text('activities')
    table.string('areaOfBenefit', 255)
    table.string('financialYearEnd', 4)
    table.text('governingDoc')
    table.text('objectives')
    table.string('website', 400)
    table.date('lastRegistrationDate')

    table.json('areas')
    table.json('beneficiaries')
    table.json('causes')
    table.json('contact')
    table.json('finances')
    table.json('postcodeGeo')
    table.json('postcodeGeoPoint')
    table.json('funding')
    table.json('image')
    table.json('social')
    table.json('names')
    table.json('numPeople')
    table.json('operations')
    table.json('orgIds')
    table.json('registrations')
    table.json('topics')
    table.json('trustees')

    table.foreign('chcId').references(`${TABLE_CHARITY}.regno`)
  })
}

exports.down = async function(knex) {
  await knex.schema.dropTable(TABLE_CHARITY_JSON)
}
