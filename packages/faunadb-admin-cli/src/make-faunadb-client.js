import faunadb from 'faunadb'

export default ({ secret, domain, port, scheme }) => {
  const options = { secret }

  if (domain) options.domain = domain
  if (port) options.port = port
  if (scheme) options.scheme = scheme

  return new faunadb.Client(options)
}
