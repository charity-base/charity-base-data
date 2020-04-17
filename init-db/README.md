# CharityBase Data

## Initialising the Database

This script creates the CharityBase relational database with empty tables.

### Requirements

- [MySQL v8+](https://www.mysql.com)
- [Node v10+](https://nodejs.org)
- [Yarn](https://yarnpkg.com)

### Installing

- `yarn`
- `cp .env-example .env` and update the variables in `.env` if necessary

### Creating database

```bash
yarn create-db # Estimated runtime: 1 second
```

### Creating tables

```bash
yarn knex migrate:latest # Estimated runtime: 1 minute
```

### Dropping database

```bash
yarn drop-db # Estimated runtime: 1 second
```
