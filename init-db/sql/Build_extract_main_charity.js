const TABLE_NAME = 'cc_extract_main_charity'

const createTable = dbName => {
  const sql = `
    CREATE TABLE ${dbName}.${TABLE_NAME}(
	    regno INT NULL,
	    coyno VARCHAR (50) NULL,
	    trustees VARCHAR(1) NOT NULL,
	    fyend VARCHAR(4) NULL,
	    welsh VARCHAR(1) NOT NULL,
	    incomedate DATETIME NULL,
	    income NUMERIC(12, 0) NULL,
	    grouptype VARCHAR(3) NULL,
	    email VARCHAR(400) NULL,
	    web VARCHAR(400) NULL
    );
  `
  return {
    tableName: TABLE_NAME,
    sql,
  }
}

module.exports = createTable