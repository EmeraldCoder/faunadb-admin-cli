import faunadb from 'faunadb'
const q = faunadb.query

export const version = 1

export async function upgrade (client) {
  await client.query(q.CreateCollection({ name: 'Movies' }))
  await client.query(q.CreateIndex({ name: 'MovieById', source: q.Collection('Movies'), terms: [{ field: ['data', 'id'] }], unique: true, serialized: true }))
}
