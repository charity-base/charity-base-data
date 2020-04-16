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

```bash
yarn index-db # Estimated runtime: 17 minutes
```

Or just charity documents:

```bash
yarn index-db:charity # Estimated runtime: 11 minutes
```

Or just filter documents:

```bash
yarn index-db:filter # Estimated runtime: 6 minutes
```


### Deleting Index

```bash
yarn delete-index MY_INDEX_NAME # Estimated runtime: 1 second
```
