const chokidar = require('chokidar')
const { state, loadFile, removeEntry } = require('../state')

module.exports.init = (sockets) => {

  const { exclude, rootPath } = state

  const htmlWatcher = chokidar.watch(state.config.srcRoot + '/**/*.html', { cwd: '.', ignoreInitial: true, ignored: exclude })
  const depWatcher = chokidar.watch(state.config.srcRoot + '/**/*', { cwd: '.', ignoreInitial: true, ignored: [...exclude, rootPath + '/**/*.html'] })

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

}


function notifyClients(sockets) {
  ;[... sockets].filter(o => o.readyState === 1).forEach(socket => socket.send('refresh'))
}