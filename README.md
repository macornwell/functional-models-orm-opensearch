# Functional Models ORM OpenSearch 

![Unit Tests](https://github.com/monolithst/functional-models-orm-opensearch/actions/workflows/ut.yml/badge.svg?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/monolithst/functional-models-orm-opensearch/badge.svg?branch=master)](https://coveralls.io/github/monolithst/functional-models-orm-opensearch?branch=master)

## Run Feature Tests

To run the feature tests, you need to set up an actual OpenSearch cluster within AWS and then call cucumber like the following:

```bash
npm run test:features -- --world-parameters '{"node": "AWS_NODE_DOMAIN_URL", "region": "us-east-1"}'
```

IMPORTANT WORD OF CAUTION: I would not attempt to use this database for anything other than this feature tests, as the indexes are completely deleted without remorse.

### Service Parameter
If you need to change the type of client connection to "aoss" you can use the following command.

```bash
npm run test:features -- --world-parameters '{"node": "AWS_NODE_DOMAIN_URL", "region": "us-east-1", "service": "aoss"}'
```