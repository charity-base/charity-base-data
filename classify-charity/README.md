# CharityBase Data

## Topic Modelling

This script uses a Java based topic modelling software to automatically generate charitable themes based on groups of words which commonly co-occur i.e. words which often appear near each other in the textual data we have for each charity.

As well as defining the themes, this script also calculates scores of how relevant each theme is to each charity, and persists this information to the database.  This is useful for classifying charities by theme.

For more background on topic modelling: [https://en.wikipedia.org/wiki/Topic_model](https://en.wikipedia.org/wiki/Topic_model)

### Requirements

- [Java](https://www.java.com)
- [MALLET](http://mallet.cs.umass.edu)
- [MySQL v8+](https://www.mysql.com)
- [Node v10+](https://nodejs.org)
- [Yarn](https://yarnpkg.com)

Before running this script the database must be initiated and all the data from the Charity Commission and 360 Giving imported (see the [other directories](../) in this repository for instruction). Much of the imported textual data is used as input in this topic model.

### Installing

- `yarn`
- `cp .env-example .env` and update the variables in `.env` if necessary


### Classifying Charities

#### Whole Process

```bash
yarn classify # Estimated runtime: 34 minutes
```

#### Sub Processes

Instead of the above you may prefer to run the process step-by-step:

##### Generating Input Text for Classification

```bash
yarn classify:generate-input # Estimated runtime: 1 minute
```

##### Generating Topics using Latent Dirichlet Allocation (LDA)

```bash
yarn classify:generate-topic # Estimated runtime: 3 minutes
```

##### Inserting Topics and Scores

```bash
yarn classify:insert-topic # Estimated runtime: 30 minutes
```


