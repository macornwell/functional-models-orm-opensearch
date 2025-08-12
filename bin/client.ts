import os from 'node:os'
import path from 'node:path'
import { Client } from '@opensearch-project/opensearch'
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws'
import { defaultProvider } from '@aws-sdk/credential-provider-node'
import { ArgumentParser } from 'argparse'
import { create as createDatastoreProvider } from '../src/datastoreProvider'
import repl from 'repl'
import { orm as createOrm, ormQueryBuilder as queryBuilder } from 'functional-models-orm'

interface ParsedArgs {
  node: string
  region: string
  service: string
}

function _parseArguments(): ParsedArgs {
  const parser = new ArgumentParser({
    description: 'OpenSearch client (AWS SigV4) - provide endpoint and region',
  })

  parser.add_argument('node', {
    help: 'OpenSearch endpoint URL (e.g., https://your-domain.us-east-1.es.amazonaws.com or aoss endpoint)',
  })

  parser.add_argument('-r', '--region', {
    help: 'AWS region (e.g., us-east-1). Defaults to us-east-1.',
    default: 'us-east-1',
  })

  parser.add_argument('-s', '--service', {
    help: 'OpenSearch service (e.g., aoss or es). Defaults to es.',
    default: 'es',
  })

  const args = parser.parse_args()
  return {
    node: args.node as string,
    region: args.region as string,
    service: args.service as string,
  }
}

async function main(): Promise<void> {
  const { node, region, service } = _parseArguments()

  const normalizedService = (service === 'aoss' ? 'aoss' : 'es') as 'es' | 'aoss'

  const client = new Client({
    ...AwsSigv4Signer({
      region,
      service: normalizedService,
      getCredentials: () => defaultProvider()(),
    }),
    node,
  })

  const datastoreProvider = createDatastoreProvider({ client })
  const orm = createOrm({ datastoreProvider })

  const info = await client.info()
  console.info('REPL ready. Context: client, orm, Model, datastoreProvider, queryBuilder, node, region, service')

  const server = repl.start({ prompt: 'opensearch> ', useGlobal: false })
  server.context.client = client
  server.context.orm = orm
  server.context.Model = orm.Model
  server.context.datastoreProvider = datastoreProvider
  server.context.queryBuilder = queryBuilder
  server.context.node = node
  server.context.region = region
  server.context.service = normalizedService

  const historyPath = process.env.OPENSEARCH_REPL_HISTORY ?? path.join(os.homedir(), '.opensearch_repl_history')
  server.setupHistory(historyPath, (err: unknown) => {
    if (err) {
      console.warn('REPL history disabled:', err)
    }
  })
}

void main()