# MongoDB -> Elasticsearch

Once you've created and supplemented the CharityBase database these scripts will help you index the data in Elasticsearch to enable fast searching and filtering.

## Requirements
* Node
* MongoDB (download and make sure it's listening on the default port `27017`)
* Elasticsearch (download and make sure it's listening on the default port `9200`)

## Install

```bash
npm install
```

## Instructions

* Update db name and index name in `config.json`
* `npm start`