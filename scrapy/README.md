# charity-base-data/scrapy

After creating the CharityBase MongoDB database using [charity-base-data/create_mongo_db](../create_mongo_db) you can use these scripts to supplement the database with content scraped from http://beta.charitycommission.gov.uk/ (that isn't included in the downloadable files).

## Requirements
* Python3
* pip3
* MongoDB (download and make sure it's listening on the default port `27017`)
  * You must also have created a database using [charity-base-data/create_mongo_db](../create_mongo_db)

## Installation
```shell
pip install -r requirements.txt
```

## Instructions
* Update `MONGO_DATABASE` in `cc_beta/settings.py`
* `scrapy crawl charities`
* You can resume scraping from a particular point by updating the page number in `CharitiesSpider.start_urls`

## Next Steps
[charity-base-data/es_index](../es_index)