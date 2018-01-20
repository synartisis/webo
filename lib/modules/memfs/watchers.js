const path = require('path')
const bus = require('../bus.js')

module.exports.attachWatchers = function attachWatchers(srcRoot, serverRoot, touchFileCb) {

  const chokidar = require('chokidar')
  const watcher = chokidar.watch(path.posix.join(srcRoot, '**'), { cwd: '.', ignoreInitial: true,ignorePermissionErrors: true, ignore: ['node_modules/**', 'dist/**'] })
  
  watcher.on('all', async (event, path) => {
    path = path.replace(/\\/g, '/')
    return touchFileCb(event, path)
  })

  if (serverRoot) {
    const serverWatcher = chokidar.watch(serverRoot + '/**/*', { cwd: '.', ignoreInitial: true })
    serverWatcher.on('all', async (event, filename) => {
      await bus.restartServer()
    })
  }

}
