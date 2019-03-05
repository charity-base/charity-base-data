# charity-base-data/grants

## Install Dependencies
```
npm install
```

## Write JSON Lines

* [Download GrantNav JSON](http://grantnav.threesixtygiving.org/developers)
* Update GrantNav JSON file path in `config.json`
* `$ node --max-old-space-size=4096 src/write-json-lines.js`

## Load JSON Lines to MongoDB

Replace db name and .jsonl filepath accordingly:

```
$ mongoimport --db charity-base --collection grants --file /path/to/grantnav-20180731084014.jsonl
```

## Classify Grants

* Update db.name in `config.json`
* Ensure classification inputDir in `config.json` does _not_ exist
* `$ npm start`


This script does the following:
* Parse the grant recipient id looking for a charity number (England & Wales) & set as a new field `recipientOrganization.GB-CHC`
* Clean & write grant descriptions to files (for grants to E&W charities) in a new directory defined in `config.classification.inputDir`
* Import files in `config.classification.inputDir` into a new MALLET file `config.classification.importOpts.malletDataFile` (taking into account the stopwords in `config.classification.importOpts.stopFile`)
* Perform topic modelling to extract common themes (number of themes defined in `config.classification.trainOpts.numTopics`)
* Set the grant topic scores as a new field `topicModelling.topics`
* Appends the grants to the appropriate charity in the `charities` collection

## Next Steps
[charity-base-data/create_elastic_index](../create_elastic_index)