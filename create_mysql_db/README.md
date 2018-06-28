# charity-base-data/create_mysql_db

A script to create a MySQL database of the Charity Commission's register extract (files downloadable from http://data.charitycommission.gov.uk/ under the [Open Government Licence](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/)).

The downloadable files are in Microsoft's `.bcp` format which are not very easy to deal with unless you have Microsoft SQL Server. However this script makes use of MySQL's `LOAD DATA INFILE` method to load the data directly into a MySQL database (without the intermediate step of converting to `.csv` as was our previous approach).

## Requirements
* Python3
* pip3
* MySQL (download and make sure it's listening on the default port `3306`)

## Installation
```shell
pip install -r requirements.txt
```

## Instructions
* Download a `Charity register extract` from `http://data.charitycommission.gov.uk/`
* Unzip the downloaded file
* Update `DATA_DIR` in `config.py` to point to the unzipped directory
* Choose a new `DB_NAME` in `config.py`
* `python create.py`

## Next Steps
After successfully creating a MySQL database you can now convert it to the CharityBase document database (in MongoDB) using the scripts in [charity-base-data/create_mongo_db](../create_mongo_db).