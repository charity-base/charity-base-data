# CharityBase Data

## Importing Data from CC SOAP API

This script imports trustee information from the [Charity Commission SOAP API](https://apps.charitycommission.gov.uk/Showcharity/API/SearchCharitiesV1/Docs/DevGuideHome.aspx).

### Requirements

- [MySQL v8+](https://www.mysql.com)
- [Node v10+](https://nodejs.org)
- [Yarn](https://yarnpkg.com)

### Installing

- `yarn`
- `cp .env-example .env` and update the variables in `.env` if necessary

### Importing data

- `yarn import-cc-soap`

Estimated runtime: 2 hours