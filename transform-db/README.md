# CharityBase Data

## Transforming to a Document Database

### Requirements

- [MySQL v8+](https://www.mysql.com)
- [Node v10+](https://nodejs.org)
- [Yarn](https://yarnpkg.com)

Before running this script the database must be initiated and all the data import scripts run (see the [other directories](../) in this repository for instruction).


### Installing

- `yarn`
- `cp .env-example .env` and update the variables in `.env` if necessary


### Writing components to charity_json & filter_json tables

```bash
yarn transform-db # Estimated runtime:
```

Or just charity documents:

```bash
yarn transform-db:charity # Estimated runtime: 30 minutes
```

Or just filter documents:

```bash
yarn transform-db:filter # Estimated runtime:
```

Or all sub-processes individually:

```bash
yarn transform-db:charity:main # Estimated runtime: 2 minutes (must come before other charity methods)
yarn transform-db:charity:area # Estimated runtime: 3 minutes
yarn transform-db:charity:category # Estimated runtime: 3 minutes
yarn transform-db:charity:finance # Estimated runtime: 4 minutes
yarn transform-db:charity:grant # Estimated runtime: 1 minute
yarn transform-db:charity:name # Estimated runtime: 4 minutes
yarn transform-db:charity:objective # Estimated runtime: 4 minutes
yarn transform-db:charity:postcode # Estimated runtime: 5 minutes
yarn transform-db:charity:registration # Estimated runtime: 3 minutes
yarn transform-db:charity:social # Estimated runtime: 1 minute
yarn transform-db:charity:topic # Estimated runtime: 2 minutes
yarn transform-db:filter:area # Estimated runtime: 1 second
yarn transform-db:filter:category # Estimated runtime: 1 second
yarn transform-db:filter:funder # Estimated runtime: 4 seconds
```
