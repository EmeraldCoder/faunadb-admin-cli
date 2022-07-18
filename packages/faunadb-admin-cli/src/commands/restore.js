import fs from 'fs'
import path from 'path'
import faunadb from 'faunadb'

const q = faunadb.query

export default async ({ input }, faunaDbClient) => {
  try {
    console.log('start database restore')

    console.log('loading backup file', input)
    const backupDocuments = await loadBackupFile(input)

    console.log('restoring documents')
    await restoreBackupDocuments(faunaDbClient, backupDocuments)

    console.log('database restore completed')
  } catch (err) {
    console.log('an error occured during the database restore')
    console.log(err)
  }
}

function loadBackupFile (filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(path.resolve(filePath), { encoding: 'utf-8' }, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(JSON.parse(data))
      }
    })
  })
}

async function restoreBackupDocuments (client, backupDocuments) {
  const backupDocumentsGroupedByCollectionId = backupDocuments.reduce((agg, x) => {
    const groupIndex = agg.findIndex(y => y.key === x.collectionId)

    if (groupIndex === -1) {
      agg.push({ key: x.collectionId, values: [x] })
    } else {
      agg[groupIndex].values.push(x)
    }

    return agg
  }, [])

  for (const backupDocumentGroup of backupDocumentsGroupedByCollectionId) {
    await client.query(
      q.Map(
        backupDocumentGroup.values.map(x => x.document),
        q.Lambda(
          'data',
          q.Create(
            q.Collection(backupDocumentGroup.key),
            { data: q.Var('data') },
          )
        )
      )
    )
  }
}
