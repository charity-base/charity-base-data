import logging
from sqlalchemy import create_engine, func
from sqlalchemy.exc import DatabaseError
from schema.models import ExtractCharity

def connect_to_db(base_url, db_name):
    try:
        engine = create_engine('mysql+mysqlconnector://%s/%s' % (base_url, db_name))
        conn = engine.connect()
        logging.info("Successfully connected to database '%s'." % db_name)
        return conn
    except:
        logging.exception("Failed to connect to database '%s'." % db_name)
        raise

def get_limits(session):
    maxmin = session.query(
        func.min(ExtractCharity.regno).label('min'),
        func.max(ExtractCharity.regno).label('max')
    ).one()

    return maxmin.min, maxmin.max