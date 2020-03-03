# CharityBase Data

## Importing GrantNav Data

This script imports the GrantNav .csv file into the MySQL database.

### Requirements

- [MySQL v8+](https://www.mysql.com)
- [Node v10+](https://nodejs.org)
- [Yarn](https://yarnpkg.com)

### Before Importing Data

- [Initialise Database](../init-db)
- [Download GrantNav Data](../download-grantnav)

### Installing

- `yarn`
- `cp .env-example .env` and update the variables in `.env` if necessary

### Importing data

- `yarn import-grantnav`

Estimated runtime: 2 minutes.