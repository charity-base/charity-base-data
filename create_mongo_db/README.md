# charity-base-data/create_mongo_db

After successfully creating a MySQL database using [charity-base-data/create_mysql_db](../create_mysql_db) you can now convert it to the CharityBase document database (in MongoDB) using these scripts.

## Requirements
* Python3
* pip3
* MySQL (download and make sure it's listening on the default port `3306`)
  * You must also have created a database using [charity-base-data/create_mysql_db](../create_mysql_db)
* MongoDB (download and make sure it's listening on the default port `27017`)

## Installation
```shell
pip install -r requirements.txt
```

## Instructions
* Update `SQL_DB_NAME` in `config.py`
* Choose new `MONGO_DB_NAME` in `config.py`
* `python convert.py`
