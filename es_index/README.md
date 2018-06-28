# charity-base-data/es_index

Once you've created the CharityBase database in MongoDB these scripts will help you load the data into Elasticsearch which enables fast searching and filtering.

## Requirements
* Node
* MongoDB (download and make sure it's listening on the default port `27017`)
  * You must also have created a database using [charity-base-data/create_mongo_db](../create_mongo_db) and added any supplementary data.
* Elasticsearch (download and make sure it's listening on the default port `9200`)

## Installation
```shell
npm install
```

## Instructions
* Choose new index in line `charitySchema.plugin(mongoosastic, { index: 'charity-base' })` of `Charity.js`
* `node es_index.js`
