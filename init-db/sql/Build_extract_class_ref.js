const TABLE_NAME = 'cc_extract_class_ref'

const createTable = dbName => {
  const sql = `
    CREATE TABLE ${dbName}.${TABLE_NAME}(
      classno varchar(10) NOT NULL,
      classtext varchar(65) NULL
    );
  `
  return {
    tableName: TABLE_NAME,
    sql,
  }
}

module.exports = createTable