import path from 'node:path'
import fs from 'node:fs'
import fsp from 'node:fs/promises'


/** @type {(config: Webo.Config) => Promise<Webo.ProjectTypes>} */
export async function detectProjectType(config) {
  if (!config.userEntry) return 'user'
  const userEntryPath = path.resolve(config.userEntry)
  const isStatic = (await fsp.stat(userEntryPath)).isDirectory()

  return isStatic ? 'static' : 'user'
}


export async function detectRoots() {

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
