const path = require('path')

module.exports.attachWatchers = function attachWatchers(srcRoot, touchFileCb) {
  
  const chokidar = require('chokidar')
  
  const watcher = chokidar.watch(path.posix.join(srcRoot, '**'), { cwd: '.', ignoreInitial: true,ignorePermissionErrors: true, ignore: ['node_modules/**', 'dist/**'] })
  
  watcher.on('all', async (event, path) => {
    path = path.replace(/\\/g, '/')
    return touchFileCb(event, path)
  })

}
