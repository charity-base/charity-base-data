const TABLE_NAME = 'cc_extract_ar_submit'

const createTable = dbName => {
  const sql = `
    CREATE TABLE ${dbName}.${TABLE_NAME}(
      regno INT NULL,
      arno CHAR(4) NOT NULL,
      submit_date DATETIME NULL
    );
  `
  return {
    tableName: TABLE_NAME,
    sql,
  }
}

module.exports = createTable
