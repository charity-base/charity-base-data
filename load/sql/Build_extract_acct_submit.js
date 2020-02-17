const TABLE_NAME = 'cc_extract_acct_submit'

const createTable = dbName => {
  const sql = `
    CREATE TABLE ${dbName}.${TABLE_NAME}(
      regno INT NULL,
      submit_date DATETIME NULL,
      arno CHAR(4) NOT NULL,
      fyend VARCHAR(4) NULL
    );
  `
  return {
    tableName: TABLE_NAME,
    sql,
  }
}

module.exports = createTable
