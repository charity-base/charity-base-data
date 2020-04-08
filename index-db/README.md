# CharityBase Data

## Indexing Data in Elasticsearch

### Requirements

- [MySQL v8+](https://www.mysql.com)
- [Node v10+](https://nodejs.org)
- [Yarn](https://yarnpkg.com)

Before running this script the database must be initiated and transformed to JSON (see the [other directories](../) in this repository for instruction).


### Installing

- `yarn`
- `cp .env-example .env` and update the variables in `.env` if necessary


### Persisting Documents to Elasticsearch

#### Whole Process

```bash
yarn index-db # Estimated runtime:
```

#### Sub Processes

Instead of the above you may prefer to run the process step-by-step.

First, upload charity documents:

```bash
yarn index-db:charity # Estimated runtime: 11 minutes
```
