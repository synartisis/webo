const { readdirp, watchDirs } = require('./fs-utils.js')
const { restartUserProcess } = require('./process-manager.js')
// const { parsable } = require('../webo-settings.js')

let cachebust = false

exports.watchServer = async function watchServer(serverRoots) {
  const serverDirs = (await Promise.all(serverRoots.map(root => readdirp(root, { type: 'dir' }))))[0]
  watchDirs(serverDirs, serverWatcher)
}


exports.watchClient = async function watchClient(clientRoots, usingCachebust) {
  cachebust = usingCachebust
  const clientDirs = (await Promise.all(clientRoots.map(root => readdirp(root, { type: 'dir' }))))[0]
  watchDirs(clientDirs, clientWatcher)
}


async function serverWatcher(event, filename) {
  if (filename.replace(/\\/g, '/').split('/').pop().startsWith('.')) return
  log(`_GREEN_${filename}`)
  restartUserProcess()
}


async function clientWatcher(event, filename) {
  // if (!parsable(filename)) return
  const { webSockets } = require('../servers/webo-server.js')
  const filenameBare = filename.replace(/\\/g, '/').split('/').pop()
  if (filenameBare.startsWith('.')) return
  log(`_GREEN_${filename}`)
  ;[... webSockets].filter(o => o.readyState === 1).forEach(socket => socket.send(cachebust ? 'reload' : 'changed ' + filenameBare))
}
