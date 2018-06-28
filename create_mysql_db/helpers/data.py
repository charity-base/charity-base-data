import logging
from sqlalchemy.sql import text

def load_data_sql(file_path, file_header, table_name):
    
    col_refs = ','.join(map(lambda x: "@col%s" % (x[0]+1), enumerate(file_header)))
    null_if_empty = ','.join(map(lambda x: "%s=nullif(@col%s,'')" % (x[1], x[0]+1), enumerate(file_header)))
    
    return text("""
        LOAD DATA INFILE '%s'
        INTO TABLE %s
        CHARACTER SET latin1
        FIELDS TERMINATED BY '@**@' ESCAPED BY ''
        LINES TERMINATED BY '*@@*'
        (%s) SET %s;
    """ % (file_path, table_name, col_refs, null_if_empty))

def bcp_to_mysql(connection, file_path, file_header, table_name):
    trans = connection.begin()
    try:
        sql = load_data_sql(file_path, file_header, table_name)
        connection.execute(sql)
        trans.commit()
        logging.info("Successfully imported data to table '%s'." % table_name)
    except:
        trans.rollback()
        logging.exception("Failed to import data to table '%s'." % table_name)
        raise
