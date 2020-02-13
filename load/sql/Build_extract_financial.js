const TABLE_NAME = 'extract_financial'

const createTable = dbName => {
  const sql = `
    CREATE TABLE ${dbName}.${TABLE_NAME}(
	    regno INT NULL,
	    fystart DATETIME NULL,
	    fyend DATETIME NULL,
	    income NUMERIC(12, 0) NULL,
	    expend NUMERIC(12, 0) NULL
    );
  `
  return {
    tableName: TABLE_NAME,
    sql,
  }
}

module.exports = createTable