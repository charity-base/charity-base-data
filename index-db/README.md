# CharityBase Data

## Indexing the Database to Elasticsearch

### Requirements

- [MySQL v8+](https://www.mysql.com)
- [Node v10+](https://nodejs.org)
- [Yarn](https://yarnpkg.com)

Before running this script the database must be initiated and all the data import scripts run (see the [other directories](../) in this repository for instruction).


### Installing

- `yarn`
- `cp .env-example .env` and update the variables in `.env` if necessary


### Writing components to charity_json table

```bash
yarn index-db:write-charity # Estimated runtime: 2 minutes
# yarn index-db:write-grant
# yarn index-db:write-finance
# yarn index-db:write-name
```
