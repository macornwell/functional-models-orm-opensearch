import { FunctionalModel, Model } from 'functional-models/interfaces'

export type DatastoreProviderInputs = {
  client: any
  getIndexForModel?: <T extends FunctionalModel>(model: Model<T>) => string
}

export type ErrorOperation = {
  status: any
  error: any
}

export type BulkResponse = {
  items: any[]
}
