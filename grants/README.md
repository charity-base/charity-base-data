# charity-base-data/grants

## Install Dependencies
```
yarn
```

## Write JSON Lines

* [Download GrantNav JSON](https://grantnav.threesixtygiving.org/developers)
* Update GrantNav JSON file path in `config.json`
* `$ node --max-old-space-size=4096 src/write-json-lines.js`

## Load JSON Lines to MongoDB

Replace db name and .jsonl filepath accordingly:

```
$ mongoimport --db charity-base-v6-4-0-nov-2019 --collection grants --file /Users/dan/Documents/Repositories/charity-base-data/git_ignore/data/grantnav-20191114124733.jsonl
```

## Classify Grants

* Update db creds in [config.json](./config.json)
* `yarn start`


This script does the following:
* Parse the grant recipient id looking for a charity number (England & Wales) & set as a new field `recipientOrganization.GB-CHC`
* Appends the grants to the appropriate charity in the `charities` collection

## Next Steps
[charity-base-data/create_elastic_index](../create_elastic_index)