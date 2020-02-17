# Import CC Data

This script imports the Charity Commission's .bcp files into a MySQL database.  Use the script in [../download](../download) to download the .bcp files if you don't already have them.

## Requirements

- [MySQL v8+](https://www.mysql.com)
- [Node v10+](https://nodejs.org)
- [Yarn](https://yarnpkg.com)

## Installing

- `yarn`
- `cp .env-example .env` and update the variables in `.env` if necessary

## Creating database

- `yarn create-db`


## Importing data

- `yarn import-data`

## Dropping database

- `yarn drop-db`
