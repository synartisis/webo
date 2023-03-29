import './patch-fs.js'
import { createStaticServer } from './static-server.js'

const [ userEntry, type ] = process.argv.splice(2)

// @ts-ignore
process.on('unhandledRejection', (reason, p) => process.send({ error: reason?.stack ?? reason }))

async function run() {
  if (type === 'user') {
    return await import(userEntry)
  }
  if (type === 'static') {
    return createStaticServer()
  }
  throw new Error(`Unkown project type ${type}`)
}

run()
