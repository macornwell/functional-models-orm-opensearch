import get from 'lodash/get'
import { DatastoreProvider, OrmQuery } from 'functional-models-orm/interfaces'
import {
  FunctionalModel,
  PrimaryKeyType,
  Model,
  ModelInstance,
} from 'functional-models/interfaces'
import { StatusCodes } from 'http-status-codes'
import * as types from './types'
import { toElasticSearch } from './lib'

export const defaultGetIndexForModel = <T extends FunctionalModel>(
  model: Model<T>
) => {
  return model.getName().toLowerCase()
}

export const create = ({
  client,
  getIndexForModel = defaultGetIndexForModel,
}: types.DatastoreProviderInputs): DatastoreProvider => {
  const _checkOrCreateIndex = async (client: any, index: string) => {
    if (await client.indices.exists({ index })) {
      return
    }
    await client.indices.create({
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
  }

  const retrieve = async <T extends FunctionalModel>(
    model: Model<T>,
    id: PrimaryKeyType
  ) => {
    const index = getIndexForModel(model)
    const { body } = await client
      .get({
        index,
        id,
      })
      .catch((e: any) => {
        if (e.meta.statusCode === StatusCodes.NOT_FOUND) {
          return {
            body: {
              _source: undefined,
            },
          }
        }
        throw e
      })

    return body._source
  }

  const search = <T extends FunctionalModel>(
    model: Model<T>,
    ormQuery: OrmQuery
  ) => {
    return Promise.resolve().then(async () => {
      const index = getIndexForModel(model)
      const search = toElasticSearch(index, ormQuery)
      const results = await client
        .search(search)
        .then((response: any) => {
          const toMap = get(response, 'body.hits.hits', [])
          const instances = toMap.map((raw: any) => raw._source)
          return {
            instances,
            page: undefined,
          }
        })
        .catch((e: any) => {
          if (e.meta.statusCode === StatusCodes.NOT_FOUND) {
            return {
              instances: [],
              page: undefined,
            }
          }
          throw e
        })
      return results
    })
  }

  const save = async <T extends FunctionalModel, TModel extends Model<T>>(
    instance: ModelInstance<T, TModel>
  ) => {
    const index = getIndexForModel(instance.getModel())
    const data = await instance.toObj()
    const id = data[instance.getPrimaryKeyName()]
    await _checkOrCreateIndex(client, index)
    await client.index({
      id,
      index,
      body: data,
    })
    return data
  }

  const bulkInsert = async <T extends FunctionalModel, TModel extends Model<T>>(
    model: TModel,
    instances: readonly ModelInstance<T, TModel>[]
  ) => {
    if (instances.length < 1) {
      return
    }
    const index = getIndexForModel(instances[0].getModel())
    await _checkOrCreateIndex(client, index)
    const operations = await instances.reduce(
      async (accP: Promise<any[]>, instance: ModelInstance<T, TModel>) => {
        const acc = await accP
        const data = await instance.toObj()
        const id = data[instance.getPrimaryKeyName()]
        return acc.concat([
          {
            index: { _index: index, _id: id },
          },
          data,
        ])
        return acc.concat(data)
      },
      Promise.resolve([] as any[])
    )
    await client.bulk({
      index,
      refresh: true,
      body: operations,
    })
    //TODO: Handle exceptions
    return
  }

  const deleteObj = async <T extends FunctionalModel, TModel extends Model<T>>(
    instance: ModelInstance<T, TModel>
  ) => {
    const index = getIndexForModel(instance.getModel())
    await _checkOrCreateIndex(client, index)
    await client.delete({
      index,
      id: await instance.getPrimaryKey(),
    })
    return
  }

  return {
    bulkInsert,
    //@ts-ignore
    search,
    retrieve,
    save,
    delete: deleteObj,
  }
}
