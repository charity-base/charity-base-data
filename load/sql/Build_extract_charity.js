const TABLE_NAME = 'extract_charity'

const createTable = dbName => {
  const sql = `
    CREATE TABLE ${dbName}.${TABLE_NAME}(
      regno INT NULL,
      subno INT NULL,
      name VARCHAR(150) NULL,
      orgtype VARCHAR(10) NULL,
      gd TEXT NULL,
      aob VARCHAR(255) NULL,
      aob_defined INT NULL,
      nhs VARCHAR(1) NOT NULL,
      ha_no INT NULL,
      corr VARCHAR(255) NULL,
      add1 VARCHAR(35) NULL,
      add2 VARCHAR(35) NULL,
      add3 VARCHAR(35) NULL,
      add4 VARCHAR(35) NULL,
      add5 VARCHAR(35) NULL,
      postcode VARCHAR(8) NULL,
      phone VARCHAR(400) NULL,
      fax INT NULL
    );
  `
  return {
  	tableName: TABLE_NAME,
  	sql,
  }
}

module.exports = createTable