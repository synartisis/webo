const path = require('path')
const chokidar = require('chokidar')
const config = require('../config')

module.exports = (entries, sockets) => {

  const watcher = chokidar.watch(path.join(path.resolve('.'), config.srcRoot), { ignoreInitial: true, cwd: '.', ignored: [/node_modules\//, /.git\//, new RegExp(config.destRoot + '/')] })

  watcher.on('add', async path => {
    entries.push(path)
    // sync()
    ;[... sockets].filter(o => o.readyState === 1).forEach(socket => socket.send('refresh'))
    
    console.log('add', path)
  })

  watcher.on('change', async path => {
    // sync()
    ;[... sockets].filter(o => o.readyState === 1).forEach(socket => socket.send('refresh'))
    console.log('change' ,path)

  })

  watcher.on('unlink', async path => {
    // sync()
    ;[... sockets].filter(o => o.readyState === 1).forEach(socket => socket.send('refresh'))
    console.log('unlink', path)
  })



}