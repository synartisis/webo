const path = require('path')
const chokidar = require('chokidar')
const state = require('../state')

module.exports.init = (sockets) => {

  const { exclude, rootPath } = state

  const htmlWatcher = chokidar.watch(rootPath + '/**/*.html', { ignoreInitial: true, ignored: exclude })
  const depWatcher = chokidar.watch(rootPath + '/**/*', { ignoreInitial: true, ignored: [...exclude, rootPath + '/**/*.html'] })

  htmlWatcher.on('all', (event, path) => {
    // console.log('HTML', event, path)
    if (['add', 'change'].includes(event)) state.updateEntry(path)
    if (event === 'unlink') state.removeEntry(path)
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