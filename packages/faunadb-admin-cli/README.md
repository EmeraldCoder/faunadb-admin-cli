# FaunaDB Admin CLI

CLI for basic administration tasks for FaunaDB

## Status

The goal of this project was to put all the tools that I always end up copying in all my projects using FaunaDB in a centralized place easy to version.

Most of my projects and databases are really small, I'm usually the only developer on my projects, and my tools work well for my simple needs. They are probably not optimized for big databases with million of documents and collections or for big team with multiple developers changing the database schemas everyday.

If you are looking for a FaunaDB migration tool that looks more professional, please check this project instead: https://github.com/fauna-labs/fauna-schema-migrate.

I decided to create my own project for some reasons:
- The mentioned project is only an experimentation and not part of their offical products yet.
- I wanted something more lightweight and closer to my basic needs.
- I wanted something more easy to tweek and change.
- For fun and to experiment.

## Install

```bash
# with NPM
npm install @emeraldcoder/faunadb-admin-cli --save

# or with Yarn
yarn add @emeraldcoder/faunadb-admin-cli

# or even with PNPM
pnpm add @emeraldcoder/faunadb-admin-cli
```

## Commands

### Upgrade

Upgrade a database schemas to the latest version using migration scripts.

```bash
faunadb-admin-cli upgrade --input ./migrations --secret [TOKEN]
```

The input option should be a directory containing the migrations script. All script should expose a version number and an upgrade function (accepting the FaunaDB client as parameter).

```js
export const version = 1

export async function upgrade (client) {
  // migrate the database schemas as you need
}
```

Example Reference: [Migrations Folder](https://github.com/EmeraldCoder/faunadb-admin-cli/blob/master/example/migrations)

### Backup

Backup all documents from the selected collections in a JSON file.

```bash
# all collections
faunadb-admin-cli backup --output ./backup.json --secret [TOKEN]

# only specific collections
faunadb-admin-cli backup --output ./backup.json --collections Users Posts Comments --secret [TOKEN]
```

The output file is structure like this:

```json
[
  {
    "collectionId": "Users",
    "document": {
      ... // document data
    }
  },
  {
    "collectionId": "Users",
    "document": {
      ... // document data
    }
  }
]
```

Example Reference: [Backup File](https://github.com/EmeraldCoder/faunadb-admin-cli/blob/master/example/backups/star-wars-backup.json)


### Restore

Restore documents included in a JSON backup file. The file need to be structured exactly like the example shown in the backup command.

```bash
faunadb-admin-cli restore --input ./backup.json --secret [TOKEN]
```

### Help

```bash
# generic help
faunadb-admin-cli --help

# help about a specific command
faunadb-admin-cli upgrade --help
```

## Advanced Options

Commands accept options to configure the FaunaDB connection. In most scenario, specifying the secret is enough because it is communicating with FaunaDB servers by default.

They are useful for testing scenarios, where you want to point to your local FaunaDB instance.

| Option | Description |
|---|---|
| domain | FaunaDB server domain |
| scheme | FaunaDB connection scheme |
| port | FaunaDB connection port |

Here an example of how to use them to connect to a local FaunaDB instance:

```bash
faunadb-admin-cli backup --output ./backup.json --secret [TOKEN] --domain localhost --scheme http --port 8443
```

## License

[MIT](https://github.com/EmeraldCoder/faunadb-admin-cli/blob/master/LICENSE)