const TABLE_NAME = 'extract_registration'

const createTable = dbName => {
  const sql = `
    CREATE TABLE ${dbName}.${TABLE_NAME}(
	    regno INT NULL,
	    subno INT NULL,
	    regdate DATETIME NULL,
	    remdate DATETIME NULL,
	    remcode CHAR(3) NULL
    );
  `
  return {
    tableName: TABLE_NAME,
    sql,
  }
}

module.exports = createTable