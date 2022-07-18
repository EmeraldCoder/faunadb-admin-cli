import faunadb from 'faunadb'
const q = faunadb.query

const documentId = 'migration-metadata'
const defaultDocument = { id: documentId, version: 1, dbVersion: null }

export default (faunaDbClient, metadataStore) => {
  let document

  async function getDbVersion () {
    if (document == null) document = await metadataStore.getOrInitializeDocument(documentId, defaultDocument)
    return document.data.dbVersion
  }

  async function setDbVersion (dbVersion) {
    if (document == null) document = await metadataStore.getOrInitializeDocument(documentId, defaultDocument)
    document.data.dbVersion = dbVersion
  }

  async function saveChange () {
    if (document != null) {
      await faunaDbClient.query(q.Update(document.ref, { data: document.data }))
    }
  }

  return {
    getDbVersion,
    setDbVersion,
    saveChange
  }
}
