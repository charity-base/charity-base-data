const TABLE_NAME = 'cc_extract_partb'

const createTable = dbName => {
  const sql = `
    CREATE TABLE ${dbName}.${TABLE_NAME}(
	    regno INT NULL,
	    artype CHAR(4) NOT NULL,
	    fystart DATETIME NOT NULL,
	    fyend DATETIME NOT NULL,
	    inc_leg TEXT NULL,
	    inc_end TEXT NULL,
	    inc_vol TEXT NULL,
	    inc_fr TEXT NULL,
	    inc_char TEXT NULL,
	    inc_invest TEXT NULL,
	    inc_other TEXT NULL,
	    inc_total TEXT NULL,
	    invest_gain TEXT NULL,
	    asset_gain TEXT NULL,
	    pension_gain TEXT NULL,
	    exp_vol TEXT NULL,
	    exp_trade TEXT NULL,
	    exp_invest TEXT NULL,
	    exp_grant TEXT NULL,
	    exp_charble TEXT NULL,
	    exp_gov TEXT NULL,
	    exp_other TEXT NULL,
	    exp_total TEXT NULL,
	    exp_support TEXT NULL,
	    exp_dep TEXT NULL,
	    reserves TEXT NULL,
	    asset_open TEXT NULL,
	    asset_close TEXT NULL,
	    fixed_assets TEXT NULL,
	    open_assets TEXT NULL,
	    invest_assets TEXT NULL,
	    cash_assets TEXT NULL,
	    current_assets TEXT NULL,
	    credit_1 TEXT NULL,
	    credit_long TEXT NULL,
	    pension_assets TEXT NULL,
	    total_assets TEXT NULL,
	    funds_end TEXT NULL,
	    funds_restrict TEXT NULL,
	    funds_unrestrict TEXT NULL,
	    funds_total TEXT NULL,
	    employees TEXT NULL,
	    volunteers TEXT NULL,
	    cons_acc TEXT NULL,
	    charity_acc TEXT NULL
    );
  `
  return {
    tableName: TABLE_NAME,
    sql,
  }
}

module.exports = createTable

