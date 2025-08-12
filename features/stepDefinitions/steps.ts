import { Given, When, Then } from '@cucumber/cucumber'
import { StatusCodes } from 'http-status-codes'
import { assert } from 'chai'
import {
  TextProperty,
  NumberProperty,
  DateProperty,
  BooleanProperty,
} from 'functional-models'
import {
  orm,
  ormQuery,
  interfaces as ormInterfaces,
} from 'functional-models-orm'
import { create as createDatastoreProvider } from '../../src/datastoreProvider'
import { Client } from '@opensearch-project/opensearch'
import { defaultProvider } from '@aws-sdk/credential-provider-node'
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws'

const createModels = (datastoreProvider: any) => {
  const ormInstance = orm({
    datastoreProvider,
  })
  return {
    MODEL_1: ormInstance.BaseModel<any>('MODEL_1', {
      properties: {
        name: TextProperty(),
        aNumber: NumberProperty(),
        aDate: DateProperty(),
        aBool: BooleanProperty(),
      },
    }),
  }
}

const DATA: any = {
  DATA_1: () => ({
    id: 'c11a4cfa-6c44-40f3-bf37-7369d9d7c929',
    name: 'test-me',
    aNumber: 1,
    aDate: '2023-01-01T00:00:01.000Z',
    aBool: true,
  }),
  DATA_2: () => [
    {
      id: '1',
      name: 'test-me-1',
      aNumber: 1,
      aDate: '2023-01-01T00:00:01.000Z',
      aBool: true,
    },
    {
      id: '2',
      name: 'test-me-2',
      aNumber: 2,
      aDate: '2023-02-01T00:00:01.000Z',
      aBool: true,
    },
    {
      id: '3',
      name: 'test-me-3',
      aNumber: 3,
      aDate: '2023-03-01T00:00:01.000Z',
      aBool: false,
    },
    {
      id: '4',
      name: 'test-me-4',
      aNumber: 4,
      aDate: '2023-04-01T00:00:01.000Z',
      aBool: false,
    },
    {
      id: '5',
      name: 'this is another',
      aDate: '2023-05-01T00:00:01.000Z',
    },
    {
      id: '6',
      name: 'the middle is good',
      aDate: '2023-06-01T00:00:01.000Z',
    },
    {
      id: '7',
      name: 'UPPER_CASE',
      aDate: '2023-06-01T00:00:01.000Z',
    },
    {
      id: '8',
      name: 'SOMETHING BIG',
      aDate: '2023-06-01T00:00:01.000Z',
    },
    {
      id: '9',
      name: 'something not big',
      aDate: '2023-06-01T00:00:01.000Z',
    },
  ],
  DATA_2a: () => ({
    id: '1',
    name: 'test-me-1',
    aNumber: 1,
    aDate: '2023-01-01T00:00:01.000Z',
    aBool: true,
  }),
  DATA_2b: () => ({
    id: '2',
    name: 'test-me-2',
    aNumber: 2,
    aDate: '2023-02-01T00:00:01.000Z',
    aBool: true,
  }),
  DATA_2c: () => ({
    id: '3',
    name: 'test-me-3',
    aNumber: 3,
    aDate: '2023-03-01T00:00:01.000Z',
    aBool: false,
  }),
  TEXT_MATCH_SEARCH: () =>
    ormQuery.ormQueryBuilder().property('name', 'test-me-2').compile(),
  CASE_TEXT_MATCH_SEARCH: () =>
    ormQuery
      .ormQueryBuilder()
      .property('name', 'UPPER_CASE', { caseSensitive: true })
      .compile(),
  BAD_CASE_TEXT_MATCH_SEARCH: () =>
    ormQuery
      .ormQueryBuilder()
      .property('name', 'upper_case', { caseSensitive: true })
      .compile(),
  NUMBER_RANGE_SEARCH: () =>
    ormQuery
      .ormQueryBuilder()
      .property('aNumber', 2, {
        type: ormInterfaces.ORMType.number,
        equalitySymbol: ormInterfaces.EQUALITY_SYMBOLS.GTE,
      })
      .property('aNumber', 4, {
        type: ormInterfaces.ORMType.number,
        equalitySymbol: ormInterfaces.EQUALITY_SYMBOLS.LT,
      })
      .compile(),
  TEXT_STARTS_WITH_SEARCH: () =>
    ormQuery
      .ormQueryBuilder()
      .property('name', 'test-me', { startsWith: true })
      .compile(),
  TEXT_ENDS_WITH_SEARCH: () =>
    ormQuery
      .ormQueryBuilder()
      .property('name', 'me-3', { endsWith: true })
      .compile(),
  CASE_TEXT_ENDS_WITH_SEARCH: () =>
    ormQuery
      .ormQueryBuilder()
      .property('name', 'BIG', { endsWith: true, caseSensitive: true })
      .compile(),
  FREE_FORM_TEXT_SEARCH: () =>
    ormQuery
      .ormQueryBuilder()
      .property('name', 'is', { startsWith: true, endsWith: true })
      .compile(),
  BOOLEAN_SEARCH: () =>
    ormQuery
      .ormQueryBuilder()
      .property('aBool', false, { type: ormInterfaces.ORMType.boolean })
      .compile(),
  TWO_TEXT_SEARCH: () =>
    ormQuery
      .ormQueryBuilder()
      .property('name', 'test-me-1')
      .property('name', 'test-me-2')
      .compile(),
  TWO_PROPERTY_SEARCH: () =>
    ormQuery
      .ormQueryBuilder()
      .property('name', 'test-me-1')
      .property('aNumber', 1, { type: ormInterfaces.ORMType.number })
      .compile(),
  SIMPLE_OR_SEARCH: () =>
    ormQuery
      .ormQueryBuilder()
      .property('name', 'test-me-1')
      .or()
      .property('name', 'test-me-2')
      .compile(),
  SIMPLE_AND_SEARCH: () =>
    ormQuery
      .ormQueryBuilder()
      .property('name', 'test-me', { startsWith: true })
      .and()
      .property('aBool', false, { type: ormInterfaces.ORMType.boolean })
      .compile(),
  DATE_RANGE_SEARCH: () =>
    ormQuery
      .ormQueryBuilder()
      //@ts-ignore
      .datesBefore('aDate', new Date('2023-05-01T00:00:01.000Z'), {})
      //@ts-ignore
      .datesAfter('aDate', new Date('2023-03-01T00:00:01.000Z'), {})
      .compile(),
  COMPLEX_BOOLEAN_SEARCH: () =>
    ormQuery
      .ormQueryBuilder()
      .property('name', 'test-me', { startsWith: true })
      .and()
      .property('aNumber', 1, { type: ormInterfaces.ORMType.number })
      .or()
      .property('aNumber', 2, { type: ormInterfaces.ORMType.number })
      .or()
      .property('aNumber', 3, { type: ormInterfaces.ORMType.number })
      .and()
      .property('aBool', true, { type: ormInterfaces.ORMType.boolean })
      .compile(),
  EMPTY_RESULT: () => [],
  UNDEFINED: () => undefined,
  SEARCH_RESULT_13: () => [
    {
      id: '1',
      name: 'test-me-1',
      aNumber: 1,
      aDate: '2023-01-01T00:00:01.000Z',
      aBool: true,
    },
    {
      id: '2',
      name: 'test-me-2',
      aNumber: 2,
      aDate: '2023-02-01T00:00:01.000Z',
      aBool: true,
    },
  ],
  SEARCH_RESULT_1: () => [
    {
      id: '2',
      name: 'test-me-2',
      aNumber: 2,
      aDate: '2023-02-01T00:00:01.000Z',
      aBool: true,
    },
  ],
  SEARCH_RESULT_2: () => [
    {
      id: '2',
      name: 'test-me-2',
      aNumber: 2,
      aDate: '2023-02-01T00:00:01.000Z',
      aBool: true,
    },
    {
      id: '3',
      name: 'test-me-3',
      aNumber: 3,
      aDate: '2023-03-01T00:00:01.000Z',
      aBool: false,
    },
  ],
  SEARCH_RESULT_3: () => [
    {
      id: '1',
      name: 'test-me-1',
      aNumber: 1,
      aDate: '2023-01-01T00:00:01.000Z',
      aBool: true,
    },
    {
      id: '2',
      name: 'test-me-2',
      aNumber: 2,
      aDate: '2023-02-01T00:00:01.000Z',
      aBool: true,
    },
    {
      id: '3',
      name: 'test-me-3',
      aNumber: 3,
      aDate: '2023-03-01T00:00:01.000Z',
      aBool: false,
    },
    {
      id: '4',
      name: 'test-me-4',
      aNumber: 4,
      aDate: '2023-04-01T00:00:01.000Z',
      aBool: false,
    },
  ],
  SEARCH_RESULT_4: () => [
    {
      id: '3',
      name: 'test-me-3',
      aNumber: 3,
      aDate: '2023-03-01T00:00:01.000Z',
      aBool: false,
    },
  ],
  SEARCH_RESULT_5: () => [
    {
      id: '5',
      name: 'this is another',
      aDate: '2023-05-01T00:00:01.000Z',
      aBool: null,
      aNumber: null,
    },
    {
      id: '6',
      name: 'the middle is good',
      aDate: '2023-06-01T00:00:01.000Z',
      aBool: null,
      aNumber: null,
    },
  ],
  SEARCH_RESULT_6: () => [
    {
      id: '3',
      name: 'test-me-3',
      aNumber: 3,
      aDate: '2023-03-01T00:00:01.000Z',
      aBool: false,
    },
    {
      id: '4',
      name: 'test-me-4',
      aNumber: 4,
      aDate: '2023-04-01T00:00:01.000Z',
      aBool: false,
    },
  ],
  SEARCH_RESULT_7: () => [
    {
      id: '3',
      name: 'test-me-3',
      aNumber: 3,
      aDate: '2023-03-01T00:00:01.000Z',
      aBool: false,
    },
    {
      id: '4',
      name: 'test-me-4',
      aNumber: 4,
      aDate: '2023-04-01T00:00:01.000Z',
      aBool: false,
    },
    {
      id: '5',
      name: 'this is another',
      aDate: '2023-05-01T00:00:01.000Z',
      aBool: null,
      aNumber: null,
    },
  ],
  SEARCH_RESULT_8: () => [
    {
      id: '3',
      name: 'test-me-3',
      aNumber: 3,
      aDate: '2023-03-01T00:00:01.000Z',
      aBool: false,
    },
    {
      id: '4',
      name: 'test-me-4',
      aNumber: 4,
      aDate: '2023-04-01T00:00:01.000Z',
      aBool: false,
    },
  ],
  SEARCH_RESULT_9: () => [
    {
      id: '1',
      name: 'test-me-1',
      aNumber: 1,
      aDate: '2023-01-01T00:00:01.000Z',
      aBool: true,
    },
    {
      id: '2',
      name: 'test-me-2',
      aNumber: 2,
      aDate: '2023-02-01T00:00:01.000Z',
      aBool: true,
    },
  ],
  SEARCH_RESULT_10: () => [
    {
      id: '1',
      name: 'test-me-1',
      aNumber: 1,
      aDate: '2023-01-01T00:00:01.000Z',
      aBool: true,
    },
  ],
  SEARCH_RESULT_11: () => [
    {
      id: '7',
      name: 'UPPER_CASE',
      aDate: '2023-06-01T00:00:01.000Z',
      aNumber: null,
      aBool: null,
    },
  ],
  SEARCH_RESULT_12: () => [
    {
      id: '8',
      name: 'SOMETHING BIG',
      aDate: '2023-06-01T00:00:01.000Z',
      aNumber: null,
      aBool: null,
    },
  ],
}

Given('a configured elastic client is created', function () {
  if (!this.parameters.node) {
    throw new Error(`Must include node in the world parameters.`)
  }
  if (!this.parameters.region) {
    throw new Error(`Must include region in the world parameters.`)
  }

  this.client = new Client({
    ...AwsSigv4Signer({
      region: this.parameters.region,
      service: this.parameters.service || 'es',
      getCredentials: defaultProvider(),
    }),
    node: this.parameters.node,
  })
})

Given('a configured datastore provider is created', function () {
  this.datastoreProvider = createDatastoreProvider({ client: this.client })
})

Given('test models are created', function () {
  this.models = createModels(this.datastoreProvider)
})

Given(
  'the indices for models are cleared',
  { timeout: 60 * 1000 },
  async function () {
    await Object.keys(this.models).reduce(async (accP, index) => {
      index = index.toLowerCase()
      const acc = await accP
      if (await this.client.indices.exists({ index })) {
        await this.client.indices.delete({ index }).catch((e: any) => {
          if (e.meta?.statusCode === StatusCodes.NOT_FOUND) {
            return
          }
          throw e
        })
      }
      await this.client.indices.create({
        index,
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              name: { type: 'keyword' },
              aNumber: { type: 'double' },
              aBool: { type: 'boolean' },
              aDate: { type: 'date' },
            },
          },
        },
      })
      return
    }, Promise.resolve())
  }
)

When('a {word} with {word} is created', function (modelKey, dataKey) {
  const data = DATA[dataKey]()
  const model = this.models[modelKey]
  this.modelInstance = model.create(data)
})

When('the model instance is saved', async function () {
  this.results = await this.modelInstance.save()
})

When('the model instance is deleted', async function () {
  this.results = await this.modelInstance.delete()
})

When(
  '{word} retrieve is called with the id from {word}',
  async function (modelKey, dataKey) {
    const data = DATA[dataKey]()
    this.results = await this.models[modelKey].retrieve(data.id)
  }
)

Then('the object data matches {word}', async function (dataKey) {
  if (!this.results) {
    throw new Error(`No results to match`)
  }
  const expected = DATA[dataKey]()
  const actual = await this.results.toObj()
  assert.deepEqual(actual, expected)
})

Then('the result is {word}', async function (dataKey) {
  const expected = DATA[dataKey]()
  assert.deepEqual(this.results, expected)
})

Then('there is an error', async function () {
  assert.isTrue(this.results instanceof Error)
})

When(
  'many instances of {word} are created using {word}',
  function (modelKey, dataKey) {
    const model = this.models[modelKey]
    const data = DATA[dataKey]()
    this.modelInstances = data.map((d: any) => model.create(d))
  }
)

When(
  'bulk insert is called on {word} with the model instances',
  async function (modelKey) {
    const model = this.models[modelKey]
    this.results = await model.bulkInsert(this.modelInstances)
  }
)

When(
  'a search is called on {word} with {word}',
  async function (modelKey, dataKey) {
    const search = DATA[dataKey]()
    const model = this.models[modelKey]
    this.results = await model.search(search)
  }
)

Then('the search results matches {word}', async function (dataKey) {
  if (!this.results) {
    throw new Error(`No results were provided.`)
  }
  const expected = DATA[dataKey]().sort((x: any, y: any) => y.id - x.id)
  const actual = (
    await this.results.instances.reduce(async (accP: any, instance: any) => {
      const acc = await accP
      return acc.concat(await instance.toObj())
    }, Promise.resolve([]))
  ).sort((x: any, y: any) => y.id - x.id)
  assert.deepEqual(actual, expected)
})
