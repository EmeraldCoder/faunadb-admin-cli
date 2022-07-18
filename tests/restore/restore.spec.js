/*
 * Test that the cli can restore documents from a backup to a database. Test use the workspace example project.
 */

import faunadb from 'faunadb'
import { beforeAll, afterAll, test, expect } from 'vitest'
import {
  exampleProjectPath,
  runCliCommand,
  faunaDbConnectionSettings,
  createTemporaryDatabase,
  deleteDatabase,
  setupDatabaseAtLatestVersion
} from '../helper.js'

const q = faunadb.query

let tempDbInfo

beforeAll(async () => {
  tempDbInfo = await createTemporaryDatabase()
  await setupDatabaseAtLatestVersion(tempDbInfo.client)
})

afterAll(async () => {
  await deleteDatabase(tempDbInfo?.database?.ref)
})

test('restore database backup', async () => {
  await runCliCommand(`pnpm restore:star-wars --domain=${faunaDbConnectionSettings.domain} --scheme=${faunaDbConnectionSettings.scheme} --port=${faunaDbConnectionSettings.port} --secret=${tempDbInfo.key.secret}`, exampleProjectPath)

  const movies = (await tempDbInfo.client.query(q.Map(q.Paginate(q.Documents(q.Collection('Movies'))), q.Lambda(x => q.Get(x))))).data.map(x => x.data)
  const characters = (await tempDbInfo.client.query(q.Map(q.Paginate(q.Documents(q.Collection('Characters'))), q.Lambda(x => q.Get(x))))).data.map(x => x.data)

  const expectedMovies = [{
    id: 'sw-new-hope',
    title: 'A New Hope'
  }]

  const expectedCharacters = [{
    id: 'sw-luke-skywalker',
    firstname: 'Luke',
    lastname: 'Skywalker'
  }, {
    id: 'sw-han-solo',
    firstname: 'Han',
    lastname: 'Solo'
  }]

  expect(sortDocuments(movies)).toEqual(sortDocuments(expectedMovies))
  expect(sortDocuments(characters)).toEqual(sortDocuments(expectedCharacters))
})

function sortDocuments (documents) {
  const documentsToSort = documents.slice()
  documentsToSort.sort((a, b) => {
    if (a.id < b.id) return -1
    if (a.id > b.id) return 1
    return 0
  })
  return documentsToSort
}
