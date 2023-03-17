import path from 'node:path'
import fs from 'node:fs'


export async function detectRoots(userEntry) {

  const serverRoots = []
  const clientRoots = []

  process.stdout.write('Auto detecting roots...')
  if (fs.existsSync(path.resolve('src/server')) && fs.existsSync(path.resolve('src/client'))) {
    serverRoots.push(path.resolve('src/server/'))
    clientRoots.push(path.resolve('src/client/'))
  }

  console.log(serverRoots.length ? `${serverRoots.length + clientRoots.length} found` : 'not found')

  return { serverRoots, clientRoots }
}
