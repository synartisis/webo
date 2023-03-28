import './patch-fs.js'
import { createStaticServer } from './static-server.js'

const [ userEntry, type ] = process.argv.splice(2)

process.on('unhandledRejection', (reason, p) => { console.error(reason); process.exit(1) })


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
// try {
// } catch (error) {
//   console.error(error)
// }