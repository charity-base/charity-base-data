# CharityBase Data

## Importing CC Data

This script imports the Charity Commission's .bcp files into a MySQL database.

### Requirements

- [MySQL v8+](https://www.mysql.com)
- [Node v10+](https://nodejs.org)
- [Yarn](https://yarnpkg.com)

### Before Importing Data

- [charity-base-data/init-db](../init-db)
- [charity-base-data/download-cc-extract](../download-cc-extract)

### Installing

- `yarn`
- `cp .env-example .env` and update the variables in `.env` if necessary

### Importing data

```bash
yarn import-cc # Estimated runtime: 2 minutes
```
