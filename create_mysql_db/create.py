from config import DB_HOST, DB_NAME, DATA_DIR, FILE_DESCRIPTORS
from schema.models import Base
from helpers.log import configure_logging
from helpers.db import connect_to_db, create_db
from helpers.data import bcp_to_mysql

def import_data(connection, file_descriptors):
	for x in file_descriptors:
		file_path = '%s/%s' % (DATA_DIR, x['file_name'])
		bcp_to_mysql(connection, file_path, x['file_header'], x['table_name'])

def main():

	logging = configure_logging()

	# Create database:
	create_db(DB_HOST, DB_NAME)

	# Connect to database:
	conn = connect_to_db(DB_HOST, DB_NAME)

	# Create tables:
	try:
		Base.metadata.create_all(conn)
	except:
		logging.exception("Failed to create tables.")
		raise

	# Import data:
	import_data(conn, FILE_DESCRIPTORS)


if __name__ == "__main__":
	main()
