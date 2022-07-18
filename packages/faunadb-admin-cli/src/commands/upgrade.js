import fs from 'fs'
import path from 'path'

export default async ({ input }, faunaDbClient, migrationMetadataStore) => {
  try {
    console.log('start database upgrade')

    const migrations = await importMigrationFiles(await listMigrationFiles(input))
    migrations.sort((a, b) => a.version - b.version)

    console.log('loading migration metadata')
    let dbVersion = await migrationMetadataStore.getDbVersion()
    if (dbVersion == null) {
      console.log('no database version found, will upgrade the database from the start')
    } else {
      console.log(`database currently at version: ${dbVersion}`)
    }

    const missingMigrations = dbVersion == null ? migrations : migrations.filter(x => x.version > dbVersion)
    if (missingMigrations.length === 0) {
      console.log('database already up to date')
    } else {
      for (const migration of missingMigrations) {
        console.log(`upgrading to version: ${migration.version}`)
        await migration.upgrade(faunaDbClient)
        await migrationMetadataStore.setDbVersion(migration.version)
      }
      await migrationMetadataStore.saveChange()
    }

    console.log('database upgrade completed')
  } catch (err) {
    console.log('an error occured during the database upgrade')
    console.log(err)
  }
}

function importMigrationFiles (migrationFiles) {
  return new Promise(async (resolve, reject) => {
    try {
      const loadMigrationPromises = migrationFiles.map(importMigrationFile)
      const migrations = await Promise.all(loadMigrationPromises)
      resolve(migrations)
    } catch (err) {
      reject(err)
    }
  })
}

async function importMigrationFile (migrationFile) {
  const migration = await import(migrationFile)

  // some validation to ensure that the migration format is correct for further processing
  if (migration == null) throw new Error(`migration file [${migrationFile}] seems empty/null`)
  if (migration.version == null) throw new Error(`version missing in migration file [${migrationFile}]`)
  if (migration.upgrade == null) throw new Error(`upgrade function missing in migration file [${migrationFile}]`)
  if (typeof migration.upgrade !== 'function') throw new Error(`upgrade function is invalid in migration file [${migrationFile}]`)

  return migration
}

function listMigrationFiles (directory) {
  const resolvedDirectory = path.resolve(directory)
  return new Promise((resolve, reject) => {
    fs.readdir(resolvedDirectory, (err, files) => {
      if (err) {
        reject(err)
      } else {
        resolve(files.map(x => path.join(resolvedDirectory, x)))
      }
    })
  })
}
