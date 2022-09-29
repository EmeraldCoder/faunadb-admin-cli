#!/usr/bin/env node

import { Command } from 'commander'
import backupCommand from './commands/backup.js'
import upgradeCommand from './commands/upgrade.js'
import restoreCommand from './commands/restore.js'
import makeFaunaDbClient from './make-faunadb-client.js'
import makeMetadataStore from './make-metadata-store.js'
import makeMigrationMetadataStore from './make-migration-metadata-store.js'

const program = new Command()

program
  .name('faunadb-admin-cli')
  .description('CLI for basic administration tasks for FaunaDB')

program.command('upgrade')
  .description('Upgrade a database to the latest version')
  .requiredOption('--input <string>', 'Directory containing migrations files')
  .requiredOption('--secret <string>', 'FaunaDB secret key')
  .option('--domain <string>', 'FaunaDB server domain')
  .option('--scheme <string>', 'FaunaDB connection scheme')
  .option('--port <number>', 'FaunaDB connection port')
  .action((options) => {
    const faunaDbClient = makeFaunaDbClient(options)
    const metadataStore = makeMetadataStore(faunaDbClient)
    const migrationMetadataStore = makeMigrationMetadataStore(faunaDbClient, metadataStore)
    upgradeCommand(options, faunaDbClient, migrationMetadataStore)
  })

program.command('backup')
  .description('Backup database documents')
  .requiredOption('--output <string>', 'Backup output file path')
  .option('--collections [collections...]', 'Collections to be backup. If not specified, all collections will be backup.')
  .requiredOption('--secret <string>', 'FaunaDB secret key')
  .option('--domain <string>', 'FaunaDB server domain')
  .option('--scheme <string>', 'FaunaDB connection scheme')
  .option('--port <number>', 'FaunaDB connection port')
  .action((options) => {
    if (options.collections != null && !Array.isArray(options.collections)) throw new Error('collections option is not valid')
    const faunaDbClient = makeFaunaDbClient(options)
    backupCommand(options, faunaDbClient)
  })

program.command('restore')
  .description('Restore database documents')
  .requiredOption('--input <string>', 'Backup file path to be restored')
  .requiredOption('--secret <string>', 'FaunaDB secret key')
  .option('--domain <string>', 'FaunaDB server domain')
  .option('--scheme <string>', 'FaunaDB connection scheme')
  .option('--port <number>', 'FaunaDB connection port')
  .action((options) => {
    const faunaDbClient = makeFaunaDbClient(options)
    restoreCommand(options, faunaDbClient)
  })

program.parse()
