# charity-base-data/grants

## Install Dependencies
```
npm install
```

## Write JSON Lines

Download GrantNav JSON file & update the file path `grantNavJSON` in `config.json`

```
node --max-old-space-size=4096 src/write-json-lines.js
```

## Load JSON Lines to MongoDB

```
mongoimport --db charity-base --collection grants --file /path/to/grantnav-20180731084014.jsonl
```

## Classify Grants

Make sure you are in the `charity-base-data/grants` directory, then run:

```
npm start
```

This script does the following:
* Parse the grant recipient id looking for a charity number (England & Wales) & set as a new field `recipientOrganization.GB-CHC`
* Clean & write grant descriptions to files (for grants to E&W charities) in a new directory defined in `config.classification.inputDir`
* Import files in `config.classification.inputDir` into a new MALLET file `config.classification.importOpts.malletDataFile` (taking into account the stopwords in `config.classification.importOpts.stopFile`)
* Perform topic modelling to extract common themes (number of themes defined in `config.classification.trainOpts.numTopics`)
* Set the grant topic scores as a new field `topicModelling.topics`
* Appends the grants to the appropriate charity in the `charities` collection
