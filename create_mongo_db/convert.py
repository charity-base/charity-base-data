#!/usr/bin/env python3
import logging
from pymongo import MongoClient
from sqlalchemy.orm import session
from helpers.log import configure_logging
from helpers.db import connect_to_db, get_limits
from schema_conversion.create_charity import insert_charities
from schema_conversion.trustees import update_trustees
from schema_conversion.aoo import update_aoo
from schema_conversion.classification import update_causes, update_beneficiaries, update_operations
from schema_conversion.finances import update_financial
from schema_conversion.subsidiaries import update_subsidiaries
from schema_conversion.names import update_names
from config import SQL_DB_USER, SQL_DB_HOST, SQL_DB_NAME, MONGO_DB_HOST, MONGO_DB_NAME, MONGO_DB_COLLECTION

def main():

	try:
		configure_logging()

		conn = connect_to_db("%s@%s" % (SQL_DB_USER, SQL_DB_HOST), SQL_DB_NAME)
		sess = session.Session(bind=conn)

		# Don't actually define schema
		# Could use an ORM-like framework in the future: https://api.mongodb.com/python/current/tools.html
		client = MongoClient(MONGO_DB_HOST, 27017)

		db = client[MONGO_DB_NAME]
		charity_collection = db[MONGO_DB_COLLECTION]
		charity_collection.create_index("ids.charityId", unique=True)
		charity_collection.create_index("ids.GB-CHC", unique=True)

		lower_limit, upper_limit = get_limits(sess)

		insert_charities(sess, charity_collection, lower_limit, upper_limit)
		update_trustees(sess, charity_collection, lower_limit, upper_limit)
		update_aoo(sess, charity_collection, lower_limit, upper_limit)
		update_causes(sess, charity_collection, lower_limit, upper_limit)
		update_beneficiaries(sess, charity_collection, lower_limit, upper_limit)
		update_operations(sess, charity_collection, lower_limit, upper_limit)
		update_financial(sess, charity_collection, lower_limit, upper_limit)
		update_subsidiaries(sess, charity_collection, lower_limit, upper_limit)
		update_names(sess, charity_collection, lower_limit, upper_limit)

		# TODO:
		# ExtractAcctSubmit, ExtractArSubmit, ExtractPartB
		# ExtractObjects, ExtractRegistration, ExtractRemoveRef
		# ExtractName for subsidiaries
		# Add non-registered charities

	except:
		logging.exception("Unhandled Exception")


if __name__ == "__main__":
	main()
