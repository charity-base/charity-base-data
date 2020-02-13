const TABLE_NAME = 'extract_charity_aoo'

const createTable = dbName => {
  const sql = `
    CREATE TABLE ${dbName}.${TABLE_NAME}(
	    regno INT NULL,
	    aootype VARCHAR(10) NOT NULL,
	    aookey INT NOT NULL,
	    welsh VARCHAR(1) NOT NULL,
	    master INT NULL
    );
  `
  return {
  	tableName: TABLE_NAME,
  	sql,
  }
}

module.exports = createTable