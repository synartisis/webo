const chokidar = require('chokidar')
const WebSocket = require('ws')
const memfs = require('../memfs')
const { log } = require('../utils')

const wsServer = new WebSocket.Server({ port: 3737 })
const sockets = new Map


module.exports.watchDirectories = paths => {
  const watcher = chokidar.watch(paths, { ignoreInitial: true, cwd: '.' })
  log('VERBOSE', 'WATCHING', paths.join(', '))

  watcher.on('add', async path => {
    log('VERBOSE', 'ADD', path)
    await memfs.attachFile(path)
  })

  watcher.on('change', async path => {
    log('VERBOSE', 'CHANGE', path)
    const depsChanged = await memfs.touch(path)
    if (path.endsWith('.html')) {
      notifyClients({ action: 'refresh' })
    } else {
      depsChanged.forEach(url => notifyClients({ action: 'inline', url }))
    }
  })

  watcher.on('unlink', async path => {
    log('VERBOSE', 'UNLINK', path)
    memfs.unlink(path)
    notifyClients({ action: 'refresh' })
  })

}


module.exports.notifyWebo = message => {
  const socket = sockets.get('/webo/')
  if (socket && socket.readyState === 1) socket.send(JSON.stringify(message))
}




wsServer.on('connection', ws => {
  const htmlFilePath = decodeURIComponent(ws.upgradeReq.url.replace('/?path=', ''))
  sockets.set(htmlFilePath, ws)
})

function notifyClients(message) {
  sockets.forEach(socket => socket.send(JSON.stringify(message)))
}
