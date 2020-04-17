const TABLE_CHARITY = 'cc_extract_charity'
const TABLE_GRANTS = 'grantnav_grant'

exports.up = async function (knex) {
  await knex.schema.createTable(TABLE_GRANTS, table => {
    table.string('id', 60).primary()
    table.text('title')
    table.text('description')
    table.string('currency', 6)
    table.decimal('amount_applied', 12, 2)
    table.decimal('amount_awarded', 12, 2)
    table.decimal('amount_disbursed', 12, 2)
    table.date('date_awarded')
    table.string('url', 255)
    table.date('planned_date_start')
    table.date('planned_date_end')
    table.integer('planned_duration_months')
    table.date('actual_date_start')
    table.date('actual_date_end')
    table.integer('actual_duration_months')

    table.string('recipient_id', 255)
    table.string('recipient_name', 255)
    table.string('recipient_charity_number', 255)
    table.string('recipient_company_number', 255)
    table.string('recipient_postcode', 50)
    table.text('recipient_location_0_geo_code_type')
    table.text('recipient_location_0_geo_code')
    table.text('recipient_location_0_geo_name')
    table.text('recipient_location_1_geo_code_type')
    table.text('recipient_location_1_geo_code')
    table.text('recipient_location_1_geo_name')
    table.text('recipient_location_2_geo_code_type')
    table.text('recipient_location_2_geo_code')
    table.text('recipient_location_2_geo_name')

    table.string('funder_id', 255)
    table.string('funder_name', 255)
    table.string('funder_postcode', 50)

    table.text('grant_programme_code')
    table.text('grant_programme_title')
    table.text('grant_programme_url')

    table.text('beneficiary_location_0_name')
    table.text('beneficiary_location_0_country_code')
    table.text('beneficiary_location_0_geo_code')
    table.text('beneficiary_location_0_geo_code_type')

    table.text('beneficiary_location_1_name')
    table.text('beneficiary_location_1_country_code')
    table.text('beneficiary_location_1_geo_code')
    table.text('beneficiary_location_1_geo_code_type')

    table.text('beneficiary_location_2_name')
    table.text('beneficiary_location_2_country_code')
    table.text('beneficiary_location_2_geo_code')
    table.text('beneficiary_location_2_geo_code_type')

    table.text('beneficiary_location_3_name')
    table.text('beneficiary_location_3_country_code')
    table.text('beneficiary_location_3_geo_code')
    table.text('beneficiary_location_3_geo_code_type')

    table.text('beneficiary_location_4_name')
    table.text('beneficiary_location_4_country_code')
    table.text('beneficiary_location_4_geo_code')
    table.text('beneficiary_location_4_geo_code_type')

    table.text('beneficiary_location_5_name')
    table.text('beneficiary_location_5_country_code')
    table.text('beneficiary_location_5_geo_code')
    table.text('beneficiary_location_5_geo_code_type')

    table.text('beneficiary_location_6_name')
    table.text('beneficiary_location_6_country_code')
    table.text('beneficiary_location_6_geo_code')
    table.text('beneficiary_location_6_geo_code_type')

    table.text('beneficiary_location_7_name')
    table.text('beneficiary_location_7_country_code')
    table.text('beneficiary_location_7_geo_code')
    table.text('beneficiary_location_7_geo_code_type')

    table.string('open_call', 3)

    table.text('dummy_0')
    table.text('data_source')
    table.text('publisher_name')
    table.text('recipient_region')
    table.text('recipient_district')
    table.text('recipient_district_geo_code')
    table.text('recipient_ward')
    table.text('recipient_ward_geo_code')
    table.text('retrieved')
    table.text('licence')
    table.text('dummy_1')

    table.foreign('recipient_charity_number').references(`${TABLE_CHARITY}.regno`)
    table.index('recipient_charity_number')
    table.index('funder_id')
    table.index('funder_name')
  })
}

exports.down = async function(knex) {
  await knex.schema.dropTable(TABLE_GRANTS)
}
