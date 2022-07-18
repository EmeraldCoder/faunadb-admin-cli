import fs from 'fs'
import path from 'path'
import faunadb from 'faunadb'

const q = faunadb.query

export default async ({ collections, output }, faunaDbClient) => {
  try {
    console.log('start database backup')

    console.log('checking which collections will included in the backup')
    let collectionIds
    if (collections != null) {
      collectionIds = collections.map(x => x.trim())
    } else {
      collectionIds = await listDatabaseCollections(faunaDbClient)
    }
    collectionIds.forEach(x => console.log(`- ${x}`))

    const data = []
    for (const collectionId of collectionIds) {
      console.log(`loading ${collectionId} collection data`)
      data.push(...await getCollectionBackupModels(faunaDbClient, collectionId))
    }

    console.log('writing output file')
    await writeFile(output, JSON.stringify(data))

    console.log('database backup completed')
  } catch (err) {
    console.log('an error occured during the database backup')
    console.log(err)
  }
}

async function listDatabaseCollections (client) {
  const queryResult = await client.query(q.Paginate(q.Collections(), { size: 100000 })) // if the database contains more than 100 000 collections, it's probably too big anyway. better use some filter to specify which collection to backup.
  return queryResult.data.map(x => x.id)
}

async function getCollectionBackupModels (client, collectionId) {
  const documents = await fetchCollectionDocuments(client, collectionId)
  return documents.map(x => ({ collectionId, document: x.data }))
}

async function fetchCollectionDocuments (client, collectionId) {
  const queryResult = await client.query(
    q.Map(
      q.Paginate(q.Documents(q.Collection(collectionId)), { size: 100000 }), // #TODO: handle collection with more than 100 000 documents
      q.Lambda(x => q.Get(x))
    )
  )
  return queryResult.data
}

function writeFile (filePath, content) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path.resolve(filePath), content, err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}
