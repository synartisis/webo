const chokidar = require('chokidar')
const WebSocket = require('ws')
const { relPath } = require('./utils')
const files = require('./files')

const wsServer = new WebSocket.Server({ port: 3737 })
const sockets = new Map

wsServer.on('connection', ws => {
  const htmlFilePath = decodeURIComponent(ws.upgradeReq.url.replace('/?path=', ''))
  sockets.set(htmlFilePath, ws)
})

function notifyClient(htmlFilePath, message) {
  const socket = sockets.get(htmlFilePath)
  if (socket && socket.readyState === 1) socket.send(JSON.stringify(message))
}

async function loadDependants(path) {
  files.dependants(path).filter(o => o.ext !== 'html').forEach(async dependant => {
    await dependant.load()
    files.htmlDependants(dependant.path).forEach(htmlFile => notifyClient(htmlFile.path, { action: 'inline', url: htmlFile.deps.find(o => o.path === dependant.path).url }))
  })
}

function watchDirectory(root, allFiles, config) {
  const watcher = chokidar.watch(root)

  // watcher.on('all', (event, path) => console.log(event, path))

  watcher.on('add', async path => {
    if (path.endsWith('.js')) return
    const existingFile = files.getFile(path)
    if (!existingFile) files.attach(path).load()
    loadDependants(relPath(path))
  })

  watcher.on('change', async path => {
    path = relPath(path)
    const file = files.getFile(path)
    if (file) delete file.built
    if (path.endsWith('.html')) {
      const modules = (await file.load()).deps.filter(o => o.devo === 'module')
      modules.map(o => o.path).forEach(o => !files.bundleRoots.includes(o) ? files.bundleRoots.push(o) && files.attach(o).load() && loadDependants(o) : null)
      notifyClient(file.path, { action: 'refresh' })
      return
    }
    loadDependants(path)
  })

  watcher.on('unlink', async path => {
    path = relPath(path)
    loadDependants(path)
  })

}


module.exports = {
  watchDirectory,
}