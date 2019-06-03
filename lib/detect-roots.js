const path = require('path')
const { existsSync } = require('fs')


exports.detectRoots = async function detectRoots(userEntry) {

  const serverRoots = []
  const clientRoots = []

  process.stdout.write('Auto detecting roots...')
  if (existsSync(path.resolve('src/server')) && existsSync(path.resolve('src/client'))) {
    serverRoots.push(path.resolve('src/server/'))
    clientRoots.push(path.resolve('src/client/'))
  }

  console.log(serverRoots.length ? `${serverRoots.length + clientRoots.length} found` : 'not found')

  return { serverRoots, clientRoots }
}
