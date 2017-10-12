const path = require('path')
const chokidar = require('chokidar')
const { state, loadFile, removeEntry } = require('../state')

module.exports.init = (sockets) => {

  const { exclude, rootPath } = state
  const { cache } = require('../state')
  
  const htmlWatcher = chokidar.watch(state.clientRoot + '/**/*.html', { cwd: '.', ignoreInitial: true, ignored: exclude })
  const depWatcher = chokidar.watch(state.clientRoot + '/**/*', { cwd: '.', ignoreInitial: true, ignored: [...exclude, rootPath + '/**/*.html'] })

  
  htmlWatcher.on('all', (event, path) => {
    // console.log('HTML', event, path)
    path = path.replace(/\\/g, '/')
    const cachedIndex = cache.findIndex(o => o.filename === path)
    if (cachedIndex !== -1) cache.splice(cachedIndex, 1)
    if (['add', 'change'].includes(event)) loadFile(path)
      if (event === 'unlink') removeEntry(path)
        notifyClients(sockets, path)
  })
  
  depWatcher.on('all', (event, path) => {
    // console.log('DEP', event, path)
    const cachedIndex = cache.findIndex(o => o.filename === path)
    if (cachedIndex !== -1) cache.splice(cachedIndex, 1)
    notifyClients(sockets, path)
  })
  
  if (state.serverRoot) {
    const serverWatcher = chokidar.watch(path.dirname(state.serverRoot) + '/**/*', { cwd: '.', ignoreInitial: true })
    serverWatcher.on('all', (event, filename) => {
      // console.log('SERVER', event, filename, path.sep)
      state.expressInstance.close()
      Object.keys(require.cache).filter(o => !o.includes(path.sep + 'node_modules' + path.sep) && !o.includes(path.sep + 'webo' + path.sep)).forEach(o => delete require.cache[o])
      // console.log(Object.keys(require.cache).filter(o => !o.includes(path.sep + 'node_modules' + path.sep) && !o.includes(path.sep + 'webo' + path.sep)))
      require(path.resolve(state.serverRoot))
      // notifyClients(sockets)
    })
  }

}


function notifyClients(sockets, path) {
  const ext = path.split('.').pop()
  ;[... sockets].filter(o => o.readyState === 1).forEach(socket => socket.send(ext === 'css' ? path : 'refresh'))
}