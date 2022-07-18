/*
 * Test that the cli can migrate database schemas according to project migrations. Test use the workspace example project.
 */

import faunadb from 'faunadb'
import { beforeEach, afterEach, test, expect } from 'vitest'
import {
  exampleProjectPath,
  runCliCommand,
  faunaDbConnectionSettings,
  createTemporaryDatabase,
  deleteDatabase,
  setupDatabaseVersion1,
  setupDatabaseAtLatestVersion
} from '../helper.js'

const q = faunadb.query

beforeEach(async (context) => {
  context.tempDbInfo = await createTemporaryDatabase()
})

afterEach(async (context) => {
  await deleteDatabase(context.tempDbInfo?.database?.ref)
})

test('upgrade a empty database', async ({ tempDbInfo: { client, key } }) => {
  await runCliCommand(`pnpm upgrade:database --domain=${faunaDbConnectionSettings.domain} --scheme=${faunaDbConnectionSettings.scheme} --port=${faunaDbConnectionSettings.port} --secret=${key.secret}`, exampleProjectPath)
  await assertThatTheDatabaseSchemaIsAsExpected(client)
})

test('upgrade a database from a previous version', async ({ tempDbInfo: { client, key } }) => {
  await setupDatabaseVersion1(client)
  await runCliCommand(`pnpm upgrade:database --domain=${faunaDbConnectionSettings.domain} --scheme=${faunaDbConnectionSettings.scheme} --port=${faunaDbConnectionSettings.port} --secret=${key.secret}`, exampleProjectPath)
  await assertThatTheDatabaseSchemaIsAsExpected(client)
})

test('upgrade a database already at the latest version', async ({ tempDbInfo: { client, key } }) => {
  await setupDatabaseAtLatestVersion(client)
  await runCliCommand(`pnpm upgrade:database --domain=${faunaDbConnectionSettings.domain} --scheme=${faunaDbConnectionSettings.scheme} --port=${faunaDbConnectionSettings.port} --secret=${key.secret}`, exampleProjectPath)
  await assertThatTheDatabaseSchemaIsAsExpected(client)
})

async function assertThatTheDatabaseSchemaIsAsExpected (client) {
  const migrationMetadataDocument = (await client.query(q.Get(q.Match(q.Index('faunadb-admin-metadata-by-id'), 'migration-metadata')))).data
  const moviesCollectionExists = await client.query(q.Exists(q.Collection('Movies')))
  const movieIndexExists = await client.query(q.Exists(q.Index('MovieById')))
  const characterCollectionExists = await client.query(q.Exists(q.Collection('Characters')))
  const characterIndexExists = await client.query(q.Exists(q.Index('CharacterById')))

  expect(migrationMetadataDocument).toEqual({ id: 'migration-metadata', version: 1, dbVersion: 2 })
  expect(moviesCollectionExists).toBe(true)
  expect(movieIndexExists).toBe(true)
  expect(characterCollectionExists).toBe(true)
  expect(characterIndexExists).toBe(true)
}
