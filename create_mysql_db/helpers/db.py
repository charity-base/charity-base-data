import logging
from sqlalchemy import create_engine
from sqlalchemy.exc import DatabaseError

def connect_to_db(base_url, db_name):
    try:
        engine = create_engine('mysql+mysqlconnector://%s/%s' % (base_url, db_name))
        conn = engine.connect()
        logging.info("Successfully connected to database '%s'." % db_name)
        return conn
    except:
        logging.exception("Failed to connect to database '%s'." % db_name)
        raise

def create_db(base_url, db_name):
    try:
        conn = connect_to_db(base_url, 'mysql')
        conn.execute("COMMIT")
        conn.execute("CREATE DATABASE %s" % db_name)
        conn.close()
        logging.info("Successfully created database '%s'." % db_name)
    except DatabaseError:
        logging.exception("Failed to create database '%s', maybe it already exists." % db_name)
        raise