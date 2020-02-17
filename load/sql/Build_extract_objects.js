const TABLE_NAME = 'cc_extract_objects'

const createTable = dbName => {
  const sql = `
    CREATE TABLE ${dbName}.${TABLE_NAME}(
      regno INT NULL,
      subno INT NULL,
      seqno VARCHAR(4) NULL,
      object TEXT NULL
    );
  `
  return {
    tableName: TABLE_NAME,
    sql,
  }
}

module.exports = createTable