const [ userEntry, type ] = process.argv.splice(2)

require('./patch-fs.js')

process.on('unhandledRejection', (reason, p) => { console.error(reason); process.exit(1) })

async function run() {
  if (type === 'user') {
    return await import(userEntry)
  }
  if (type === 'static') {
    const { createStaticServer } = require('./static-server.js')
    return createStaticServer()
  }
  throw new Error(`Unkown project type ${type}`)
}

run()
.catch(err => {
  console.error(err)
})