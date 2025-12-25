# Description
REST API powering Helios, to capture & record flights, pilot currency & progression.

# Getting started to run locally
## Requirements
- Latest NodeJS LTS version installed
- Docker installed & running

## Installation

```bash
$ npm install
```
```bash
$ docker-compose up -d
```


## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
# Creating new migrations