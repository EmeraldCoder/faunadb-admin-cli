import { exec } from 'child_process'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import faunadb from 'faunadb'
const q = faunadb.query

export const exampleProjectPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '/../example')

export const faunaDbConnectionSettings = { domain: 'localhost', scheme: 'http', port: 8443 }

export async function createTemporaryDatabase () {
  const adminClient = new faunadb.Client({ secret: 'secret', ...faunaDbConnectionSettings })
  const database = await adminClient.query(q.CreateDatabase({ name: `temp_${crypto.randomUUID()}` }))
  const key = await adminClient.query(q.CreateKey({ database: database.ref, role: 'server' }))
  const client = new faunadb.Client({ secret: key.secret, ...faunaDbConnectionSettings })
  return { key, client, database }
}

export async function deleteDatabase (databaseRef) {
  if (databaseRef) {
    const adminClient = new faunadb.Client({ secret: 'secret', ...faunaDbConnectionSettings })
    await adminClient.query(q.Delete(databaseRef))
  }
}

export function runCliCommand (command, cwd) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        let customError = new Error(error.message)
        customError.stdout = stdout
        reject(customError)
      } else {
        resolve(stdout)
      }
    })
  })
}

export function readJsonFile (filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, { encoding: 'utf-8' }, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(JSON.parse(data))
      }
    })
  })
}

export function tryDeleteFile (filePath) {
  return new Promise((resolve) => {
    fs.rm(filePath, () => {
      resolve()
    })
  })
}

export async function setupDatabaseDocument (client, collection, document) {
  await client.query(q.Create(q.Collection(collection), { data: document }))
}

export async function setupDatabaseVersion1 (client) {
  await setupMigration1(client)
  await setupMigrationMetadata(client, 1)
}

export async function setupDatabaseAtVersion2 (client) {
  await setupMigration1(client)
  await setupMigration2(client)
  await setupMigrationMetadata(client, 2)
}

export const setupDatabaseAtLatestVersion = setupDatabaseAtVersion2 // alias

async function setupMigration1 (client) {
  await client.query(q.CreateCollection({ name: 'Movies' }))
  await client.query(q.CreateIndex({ name: 'MovieById', source: q.Collection('Movies'), terms: [{ field: ['data', 'id'] }], unique: true, serialized: true }))
}

async function setupMigration2 (client) {
  await client.query(q.CreateCollection({ name: 'Characters' }))
  await client.query(q.CreateIndex({ name: 'CharacterById', source: q.Collection('Characters'), terms: [{ field: ['data', 'id'] }], unique: true, serialized: true }))
}

async function setupMigrationMetadata (client, dbVersion) {
  await client.query(q.CreateCollection({ name: 'faunadb-admin-metadata' }))

  await client.query(
    q.CreateIndex({
      name: 'faunadb-admin-metadata-by-id',
      source: q.Collection('faunadb-admin-metadata'),
      terms: [{ field: ['data', 'id'] }],
      unique: true,
      serialized: true
    })
  )

  await client.query(
    q.Create(
      q.Collection('faunadb-admin-metadata'),
      { data: { id: 'migration-metadata', version: 1, dbVersion: dbVersion ?? null } }
    )
  )
}
