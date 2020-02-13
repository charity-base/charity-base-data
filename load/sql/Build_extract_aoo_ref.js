const TABLE_NAME = 'extract_aoo_ref'

const createTable = dbName => {
  const sql = `
    CREATE TABLE ${dbName}.${TABLE_NAME}(
      aootype varchar(10) NOT NULL,
      aookey int NOT NULL,
      aooname varchar(255) NOT NULL,
      aoosort varchar(100) NOT NULL,
      welsh varchar(1) NOT NULL,
      master int NULL
    );
  `
  return {
    tableName: TABLE_NAME,
    sql,
  }
}

module.exports = createTable
