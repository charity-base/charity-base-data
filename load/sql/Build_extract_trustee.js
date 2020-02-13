const TABLE_NAME = 'extract_trustee'

const createTable = dbName => {
  const sql = `
    CREATE TABLE ${dbName}.${TABLE_NAME}(
      regno INT NULL,
      trustee VARCHAR(255) NULL
    );
  `
  return {
    tableName: TABLE_NAME,
    sql,
  }
}

module.exports = createTable