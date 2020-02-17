const TABLE_NAME = 'cc_extract_remove_ref'

const createTable = dbName => {
  const sql = `
    CREATE TABLE ${dbName}.${TABLE_NAME}(
      code CHAR(3) NULL,
      text CHAR(25) NULL
    );
  `
  return {
    tableName: TABLE_NAME,
    sql,
  }
}

module.exports = createTable