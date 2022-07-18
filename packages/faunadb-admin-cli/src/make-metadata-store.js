import faunadb from 'faunadb'
const q = faunadb.query

const collectionId = 'faunadb-admin-metadata'
const indexId = 'faunadb-admin-metadata-by-id'

export default (faunaDbClient) => {
  return {
    getOrInitializeDocument: (documentType, defaultDocument) => getOrInitializeDocument(faunaDbClient, documentType, defaultDocument)
  }
}

async function getOrInitializeDocument (faunaDbClient, documentType, defaultDocument) {
  const setupIsOk = await checkIfSetupIsOk(faunaDbClient)

  if (!setupIsOk) {
    await initializeOrRepairSetup(faunaDbClient)
  }

  await createDocumentIfNotExists(faunaDbClient, documentType, defaultDocument)

  return await faunaDbClient.query(
    q.Get(
      q.Match(
        q.Index(indexId),
        documentType
      )
    )
  )
}

async function initializeOrRepairSetup (faunaDbClient) {
  await createCollectionIfNotExists(faunaDbClient)
  await createIndexIfNotExists(faunaDbClient)
}

async function createDocumentIfNotExists (faunaDbClient, documentType, defaultDocument) {
  const exists = await checkIfDocumentExists(faunaDbClient, documentType)
  if (!exists) {
    await faunaDbClient.query(
      q.Create(
        q.Collection(collectionId),
        { data: defaultDocument }
      )
    )
  }
}

async function createIndexIfNotExists (faunaDbClient) {
  const exists = await checkIfIndexExists(faunaDbClient)
  if (!exists) {
    await faunaDbClient.query(
      q.CreateIndex({
        name: indexId,
        source: q.Collection(collectionId),
        terms: [{ field: ['data', 'id'] }],
        unique: true,
        serialized: true
      })
    )
  }
}

async function createCollectionIfNotExists (faunaDbClient) {
  const exists = await checkIfCollectionExists(faunaDbClient)
  if (!exists) {
    await faunaDbClient.query(q.CreateCollection({ name: collectionId }))
  }
}

async function checkIfCollectionExists (faunaDbClient) {
  return await faunaDbClient.query(q.Exists(q.Collection(collectionId)))
}

async function checkIfIndexExists (faunaDbClient) {
  return await faunaDbClient.query(q.Exists(q.Index(indexId)))
}

async function checkIfDocumentExists (faunaDbClient, documentType) {
  return await faunaDbClient.query(q.Exists(q.Match(q.Index(indexId), documentType)))
}

async function checkIfSetupIsOk (faunaDbClient) {
  return await checkIfCollectionExists(faunaDbClient) &&
    await checkIfIndexExists(faunaDbClient)
}
