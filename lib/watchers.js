import { readdirp, watchDirs } from './fs-utils.js'
import { restartUserProcess } from './process-manager.js'
import { webSockets } from '../servers/webo-server.js'
// const { parsable } = require('../webo-settings.js')

let cachebust = false

export async function watchServer(serverRoots) {
  const serverDirs = (await Promise.all(serverRoots.map(root => readdirp(root, { type: 'dir' })))).flat()
  watchDirs(serverDirs, serverWatcher)
}


export async function watchClient(clientRoots, usingCachebust) {
  cachebust = usingCachebust
  const clientDirs = (await Promise.all(clientRoots.map(root => readdirp(root, { type: 'dir' })))).flat()
  watchDirs(clientDirs, clientWatcher)
}


async function serverWatcher(event, filename) {
  if (filename.replace(/\\/g, '/').split('/').pop().startsWith('.')) return
  log(`_GREEN_${filename}`)
  restartUserProcess()
}


async function clientWatcher(event, filename) {
  // if (!parsable(filename)) return
  const filenameBare = filename.replace(/\\/g, '/').split('/').pop()
  if (filenameBare.startsWith('.')) return
  log(`_GREEN_${filename}`)
  ;[... webSockets].filter(o => o.readyState === 1).forEach(socket => socket.send(cachebust ? 'reload' : 'changed ' + filenameBare))
}
