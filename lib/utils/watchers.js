import { readdirp, watchDirs } from './utils.js'
import { restartUserProcess } from '../processes/process-manager.js'
import { webSockets } from '../servers/webo-server.js'

let cachebust = false

/** @type {(serverRoots: string[]) => Promise<void>} */
export async function watchServer(serverRoots) {
  const serverDirs = (await Promise.all(serverRoots.map(root => readdirp(root, 'dir')))).flat()
  watchDirs(serverDirs, serverWatcher)
}


/** @type {(clientRoots: string[], usingCachebust: boolean) => Promise<void>} */
export async function watchClient(clientRoots, usingCachebust) {
  cachebust = usingCachebust
  const clientDirs = (await Promise.all(clientRoots.map(root => readdirp(root, 'dir')))).flat()
  watchDirs(clientDirs, clientWatcher)
}


/** @type {(event: any, filename: string) => Promise<void>} */
async function serverWatcher(event, filename) {
  if (filename.replace(/\\/g, '/').split('/').pop()?.startsWith('.')) return
  log(`_GREEN_${filename}`)
  restartUserProcess()
}


/** @type {(event: any, filename: string) => Promise<void>} */
async function clientWatcher(event, filename) {
  const filenameBare = filename.replace(/\\/g, '/').split('/').pop()
  if (!filenameBare || filenameBare.startsWith('.')) return
  log(`_GREEN_${filename}`)
  ;[... webSockets].filter(o => o.readyState === 1).forEach(socket => socket.send(cachebust ? 'reload' : 'changed ' + filenameBare))
}
