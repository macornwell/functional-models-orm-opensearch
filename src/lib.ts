import merge from 'lodash/merge'
import uniq from 'lodash/uniq'
import {
  interfaces as ormInterfaces,
  ormQuery as ormQueryLib,
} from 'functional-models-orm'

enum ElasticEqualityType {
  lt = 'lt',
  lte = 'lte',
  gt = 'gt',
  gte = 'gte',
}

enum ElasticQueryType {
  match = 'match',
  term = 'term',
  wildcard = 'wildcard',
  range = 'range',
}

const EQUALITY_SYMBOL_MAP: {
  [key in ormInterfaces.EQUALITY_SYMBOLS]: string | undefined
} = {
  [ormInterfaces.EQUALITY_SYMBOLS.LT]: ElasticEqualityType.lt,
  [ormInterfaces.EQUALITY_SYMBOLS.LTE]: ElasticEqualityType.lte,
  [ormInterfaces.EQUALITY_SYMBOLS.GT]: ElasticEqualityType.gt,
  [ormInterfaces.EQUALITY_SYMBOLS.GTE]: ElasticEqualityType.gte,
  [ormInterfaces.EQUALITY_SYMBOLS.EQUALS]: undefined,
}

export const toElasticValue = (
  s: ormInterfaces.PropertyStatement,
  queryType: ElasticQueryType
) => {
  if (queryType === ElasticQueryType.term) {
    return {
      value: s.value,
    }
  }
  if (queryType === ElasticQueryType.wildcard) {
    const value = s.value instanceof Date ? s.value.toISOString() : s.value
    return {
      value: `${s.options.endsWith ? '*' : ''}${value}${s.options.startsWith ? '*' : ''}`,
    }
  }
  if (queryType === ElasticQueryType.range) {
    const equalitySymbol =
      EQUALITY_SYMBOL_MAP[
        s.options.equalitySymbol as ormInterfaces.EQUALITY_SYMBOLS
      ]
    if (!equalitySymbol) {
      throw new Error(`Unexpected equality symbol ${equalitySymbol}`)
    }
    return {
      [equalitySymbol]: s.value,
    }
  }
  throw new Error(`Unhandled queryType: ${queryType}`)
}

export const getElasticQueryType = (
  s: ormInterfaces.PropertyStatement
): ElasticQueryType => {
  if (
    s.valueType === ormInterfaces.ORMType.string ||
    s.valueType === ormInterfaces.ORMType.date
  ) {
    if (s.options.startsWith || s.options.endsWith) {
      return ElasticQueryType.wildcard
    }
    return ElasticQueryType.term
  }
  if (s.valueType === ormInterfaces.ORMType.number) {
    if (s.options.equalitySymbol !== ormInterfaces.EQUALITY_SYMBOLS.EQUALS) {
      return ElasticQueryType.range
    }
  }
  return ElasticQueryType.term
}

export const toElasticSize = (take: number | undefined) => {
  return take
    ? {
        size: take,
      }
    : {}
}

export const toElasticSort = (
  sort: ormInterfaces.SortStatement | undefined
) => {
  return sort
    ? {
        sort: `${sort.key}:${sort.order ? 'asc' : 'desc'}`,
      }
    : {}
}

export const toElasticPaging = (
  _: ormInterfaces.PaginationStatement | undefined
) => {
  return ''
}

export const toElasticQuery = (s: ormInterfaces.PropertyStatement) => {
  const queryType = getElasticQueryType(s)
  return {
    [queryType]: {
      [`${s.name}`]: toElasticValue(s, queryType),
    },
  }
}

const _getDateValue = (d: Date | string) => {
  return d instanceof Date ? d.toISOString() : d
}

export const toElasticDateRange = (
  statement:
    | ormInterfaces.DatesBeforeStatement
    | ormInterfaces.DatesAfterStatement
) => {
  const name =
    statement.type === 'datesBefore'
      ? statement.options.equalToAndBefore
        ? 'lte'
        : 'lt'
      : statement.options.equalToAndAfter
        ? 'gte'
        : 'gt'
  return {
    range: {
      [statement.key]: {
        [name]: _getDateValue(statement.date),
      },
    },
  }
}

export const toElasticDateQuery = (
  datesBefore: { [s: string]: ormInterfaces.DatesBeforeStatement },
  datesAfter: { [s: string]: ormInterfaces.DatesAfterStatement }
) => {
  const dateProps = uniq(
    Object.keys(datesBefore).concat(Object.keys(datesAfter))
  )
  if (dateProps.length < 1) {
    return undefined
  }
  return {
    range: dateProps.reduce((acc, name) => {
      const before = datesBefore[name]
        ? {
            [datesBefore[name].options.equalToAndBefore ? 'lte' : 'lt']:
              _getDateValue(datesBefore[name].date),
          }
        : {}
      const after = datesAfter[name]
        ? {
            [datesAfter[name].options.equalToAndAfter ? 'gte' : 'gt']:
              _getDateValue(datesAfter[name].date),
          }
        : {}
      return merge(acc, { [name]: merge(before, after) })
    }, {}),
  }
}

export const propertiesToElasticQuery = (
  properties: readonly ormInterfaces.PropertyStatement[]
) => {
  const statements = properties.reduce((acc, statement) => {
    const query = toElasticQuery(statement)
    return acc.concat(query)
  }, [] as any[])
  // TODO: We need to group the statements together by "and" and "or" statements. all and statements are 'must' and all or are "should"
  return [
    {
      bool: {
        must: statements,
      },
    },
  ]
}

export const getPropertyStatements = (
  statements: readonly ormInterfaces.OrmQueryStatement[]
): ormInterfaces.PropertyStatement[] => {
  return statements.filter(s => {
    return s.type === 'property'
  }) as ormInterfaces.PropertyStatement[]
}

const createMust = (
  statement:
    | ormInterfaces.PropertyStatement
    | ormInterfaces.DatesBeforeStatement
    | ormInterfaces.DatesAfterStatement
) => {
  if (statement.type === 'datesBefore' || statement.type === 'datesAfter') {
    const dateQuery = toElasticDateRange(statement)
    return {
      bool: {
        must: [dateQuery],
      },
    }
  }

  const query = toElasticQuery(statement)
  return {
    bool: {
      must: [query],
    },
  }
}

const createShould = (
  orProperties: (
    | ormInterfaces.PropertyStatement
    | ormInterfaces.DatesBeforeStatement
    | ormInterfaces.DatesAfterStatement
  )[]
) => {
  const queries = orProperties.reduce((acc, statement) => {
    if (statement.type === 'datesBefore' || statement.type === 'datesAfter') {
      const dateQuery = toElasticDateRange(statement)
      return acc.concat(dateQuery)
    }

    const query = toElasticQuery(statement)
    return acc.concat(query)
  }, [] as any[])
  return {
    bool: {
      should: queries,
    },
  }
}

export const toElasticSearch = (
  index: string,
  ormQuery: ormInterfaces.OrmQuery
) => {
  const booleanChains = ormQueryLib.createBooleanChains(ormQuery)
  const musts = booleanChains.ands.map(createMust)
  const shoulds = booleanChains.orChains.map(createShould)
  const sort = toElasticSort(ormQuery.sort)
  const size = toElasticSize(ormQuery.take)
  const paging = toElasticPaging(ormQuery.page)

  return merge(
    { index },
    {
      body: {
        query: {
          bool: {
            must: [...musts, ...shoulds],
          },
        },
      },
    },
    sort,
    paging,
    size
  )
}
