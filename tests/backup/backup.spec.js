/*
 * Test that the cli can backup documents from a database. Test use the workspace example project.
 */

import path from 'path'
import { beforeAll, afterAll, afterEach, test, expect } from 'vitest'
import {
  exampleProjectPath,
  readJsonFile,
  tryDeleteFile,
  runCliCommand,
  faunaDbConnectionSettings,
  createTemporaryDatabase,
  deleteDatabase,
  setupDatabaseDocument,
  setupDatabaseAtLatestVersion
} from '../helper.js'

const backupOutputFilePath = path.join(exampleProjectPath, '/backup.json') // backup.json is the hardcoded backup output file in the example project package.json

const mockMovieDocument = {
  id: 'sw-empire-strike-back',
  title: 'The Empire Strike Back'
}

const mockCharacterDocument = {
  id: 'sw-vader',
  firstname: 'Darth',
  lastname: 'Vader'
}

let tempDbInfo

beforeAll(async () => {
  tempDbInfo = await createTemporaryDatabase()
  await setupDatabaseAtLatestVersion(tempDbInfo.client)
  await setupDatabaseDocument(tempDbInfo.client, 'Movies', mockMovieDocument)
  await setupDatabaseDocument(tempDbInfo.client, 'Characters', mockCharacterDocument)
})

afterEach(async () => {
  await tryDeleteFile(backupOutputFilePath)
})

afterAll(async () => {
  await deleteDatabase(tempDbInfo?.database?.ref)
})

test('backup full database', async () => {
  await runCliCommand(`pnpm backup --domain=${faunaDbConnectionSettings.domain} --scheme=${faunaDbConnectionSettings.scheme} --port=${faunaDbConnectionSettings.port} --secret=${tempDbInfo.key.secret}`, exampleProjectPath)

  const generatedBackup = await readJsonFile(backupOutputFilePath)

  const expectedBackup = [
    {
      collectionId: 'faunadb-admin-metadata',
      document: {
        id: 'migration-metadata',
        version: 1,
        dbVersion: 2
      }
    },
    {
      collectionId: 'Movies',
      document: mockMovieDocument
    },
    {
      collectionId: 'Characters',
      document: mockCharacterDocument
    }
  ]

  // orders of document in the backup doesn't matter
  // we sort them to help the toEqual function to compare both arrays
  expect(sortBackup(generatedBackup)).toEqual(sortBackup(expectedBackup))
})

test('backup database subset', async () => {
  await runCliCommand(`pnpm backup --collections Movies Characters --domain=${faunaDbConnectionSettings.domain} --scheme=${faunaDbConnectionSettings.scheme} --port=${faunaDbConnectionSettings.port} --secret=${tempDbInfo.key.secret}`, exampleProjectPath)

  const generatedBackup = await readJsonFile(backupOutputFilePath)

  const expectedBackup = [
    {
      collectionId: 'Movies',
      document: mockMovieDocument
    },
    {
      collectionId: 'Characters',
      document: mockCharacterDocument
    }
  ]

  // orders of document in the backup doesn't matter
  // we sort them to help the toEqual function to compare both arrays
  expect(sortBackup(generatedBackup)).toEqual(sortBackup(expectedBackup))
})

function sortBackup (backup) {
  const backupToSort = backup.slice()
  backupToSort.sort((a, b) => {
    if (a.collectionId < b.collectionId) return -1
    if (a.collectionId > b.collectionId) return 1
    if (a.document.id < b.document.id) return -1
    if (a.document.id > b.document.id) return 1
    return 0
  })
  return backupToSort
}
