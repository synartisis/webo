const path = require('path')
const chokidar = require('chokidar')
const state = require('../state')

module.exports = (entries, sockets) => {

  const watcher = chokidar.watch(path.join(path.resolve('.'), state.config.srcRoot), { ignoreInitial: true, cwd: '.', ignored: [/node_modules\//, /.git\//, new RegExp(state.config.destRoot + '/')] })

  watcher.on('add', async path => {
    if (path.endsWith('.html')) state.addEntry(path)
    // entries.push(path)
    // sync()
    console.log(entries)
    ;[... sockets].filter(o => o.readyState === 1).forEach(socket => socket.send('refresh'))
    
    console.log('add', path)
  })

  watcher.on('change', async path => {
    // sync()
    if (path.endsWith('.html')) state.changeEntry(path)
      ;[... sockets].filter(o => o.readyState === 1).forEach(socket => socket.send('refresh'))
    console.log('change' ,path)

  })

  watcher.on('unlink', async path => {
    // sync()
    if (path.endsWith('.html')) state.removeEntry(path)
      ;[... sockets].filter(o => o.readyState === 1).forEach(socket => socket.send('refresh'))
    console.log('unlink', path)
  })



}