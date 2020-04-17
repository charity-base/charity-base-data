# CharityBase Data

## Scraping Social Media Handle from Charity Websites

Extracts twitter and facebook handles from charity websites.  Also cleans the charity website field in the CC table.

### Requirements

- [MySQL v8+](https://www.mysql.com)
- [Node v10+](https://nodejs.org)
- [Yarn](https://yarnpkg.com)

### Installing

- `yarn`
- `cp .env-example .env` and update the variables in `.env` if necessary

### Importing Data

- `yarn import-social-handles`

Estimated runtime: 6 hours
