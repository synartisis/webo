const chokidar = require('chokidar')
const WebSocket = require('ws')
const { relPath } = require('../utils')
const files = require('../filesystem/files')
const { log } = require('../utils')

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
  const dependants = files.dependants(path).filter(o => o.ext !== 'html')
  dependants.forEach(async dependant => {
    await dependant.load()
    files.htmlDependants(dependant.path).forEach(htmlFile => {
      const htmlFileDep = htmlFile.deps.find(o => o.path === dependant.path)
      if (htmlFileDep) notifyClient(htmlFile.path, { action: 'inline', url: htmlFileDep.url })
    })
  })
  if (dependants.length === 0) {
    const file = files.getFile(path)
    if (file) {
      await file.load()
      files.htmlDependants(file.path).forEach(htmlFile => {
        const htmlFileDep = htmlFile.deps.find(o => o.path === file.path)
        if (htmlFileDep) notifyClient(htmlFile.path, { action: 'inline', url: htmlFileDep.url })
      })
    }
  }
}

function watchDirectory(root, allFiles, config) {
  const watcher = chokidar.watch(root)

  // watcher.on('all', (event, path) => log('VERBOSE', event, path))

  watcher.on('add', async path => {
    path = relPath(path)
    let file = files.getFile(path)
    if (file) return
    // log('VERBOSE', 'ADD', path)
    let props = {}
    if (path.endsWith('.js') || path.endsWith('.css')) {
      const htmlDep = files.htmlDeps().find(b => b.path === path)
      if (!htmlDep) return
      props.type = htmlDep.type || (path.endsWith('.js') ? 'script' : 'stylesheet')
    }
    file = Object.assign(files.attach(path), props)
    loadDependants(path)
  })

  watcher.on('change', async path => {
    path = relPath(path)
    log('VERBOSE', 'CHANGE', path)
    const file = files.getFile(path)
    if (file) delete file.built
    if (path.endsWith('.html')) {
      files.files.filter(o => o.ext === 'html' && o.layout === path).forEach(async html => await html.load() && notifyClient(html.path, { action: 'refresh' }))
      const modules = (await file.load()).deps.filter(o => o.type === 'module')
      modules.map(o => o.path).forEach(path => !files.htmlDeps('module').find(o => o.path === path) ? files.attach(path).load() && loadDependants(path) : null)
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

function notifyWebo(message) {
  const socket = sockets.get('/webo/')
  if (socket && socket.readyState === 1) socket.send(JSON.stringify(message))
}



module.exports = {
  watchDirectory,
  notifyWebo,
}