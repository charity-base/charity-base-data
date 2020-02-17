const TABLE_NAME = 'cc_extract_name'

const createTable = dbName => {
  const sql = `
    CREATE TABLE ${dbName}.${TABLE_NAME}(
      regno INT NULL,
      subno INT NULL,
      nameno INT NOT NULL,
      name VARCHAR(255) NULL
    );
  `
  return {
    tableName: TABLE_NAME,
    sql,
  }
}

module.exports = createTable