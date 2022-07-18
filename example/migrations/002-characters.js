import faunadb from 'faunadb'
const q = faunadb.query

export const version = 2

export async function upgrade (client) {
  await client.query(q.CreateCollection({ name: 'Characters' }))
  await client.query(q.CreateIndex({ name: 'CharacterById', source: q.Collection('Characters'), terms: [{ field: ['data', 'id'] }], unique: true, serialized: true }))
}
