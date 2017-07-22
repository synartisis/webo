const path = require('path')
const chokidar = require('chokidar')
const { state, loadFile, removeEntry } = require('../state')

module.exports.init = (sockets) => {

  const { exclude, rootPath } = state

  const htmlWatcher = chokidar.watch(state.clientRoot + '/**/*.html', { cwd: '.', ignoreInitial: true, ignored: exclude })
  const depWatcher = chokidar.watch(state.clientRoot + '/**/*', { cwd: '.', ignoreInitial: true, ignored: [...exclude, rootPath + '/**/*.html'] })
  const serverWatcher = chokidar.watch(path.dirname(state.serverRoot) + '/**/*', { cwd: '.', ignoreInitial: true })

  htmlWatcher.on('all', (event, path) => {
    // console.log('HTML', event, path)
    path = path.replace(/\\/g, '/')
    if (['add', 'change'].includes(event)) loadFile(path)
    if (event === 'unlink') removeEntry(path)
    notifyClients(sockets)
  })

  depWatcher.on('all', (event, path) => {
    // console.log('DEP', event, path)
    notifyClients(sockets)
  })

  serverWatcher.on('all', (event, filename) => {
    // console.log('SERVER', event, filename, path.sep)
    state.expressInstance.close()
    Object.keys(require.cache).filter(o => !o.includes(path.sep + 'node_modules' + path.sep) && !o.includes(path.sep + 'webo' + path.sep)).forEach(o => delete require.cache[o])
    // console.log(Object.keys(require.cache).filter(o => !o.includes(path.sep + 'node_modules' + path.sep) && !o.includes(path.sep + 'webo' + path.sep)))
    require(path.resolve(state.serverRoot))
    // notifyClients(sockets)
  })

}


function notifyClients(sockets) {
  ;[... sockets].filter(o => o.readyState === 1).forEach(socket => socket.send('refresh'))
}