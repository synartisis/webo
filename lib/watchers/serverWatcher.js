const path = require('path')
const chokidar = require('chokidar')
const { log } = require('../utils')


module.exports = (expressServer, paths, extensions) => {
  const watcher = chokidar.watch(paths, { ignoreInitial: true, cwd: '.' })
  log('VERBOSE', 'WATCHING SERVER', paths.join(', '))

  watcher.on('change', async filepath => {
    const ext = filepath.split('.').pop()
    if (extensions && !extensions.includes(ext)) return;
    // console.log(Object.keys(require.cache).filter(o => !o.includes('node_modules') && !o.includes('webo')))
    Object.keys(require.cache).filter(o => !o.includes('node_modules') && !o.includes('webo')).forEach(o => delete require.cache[o])
    expressServer.instance.close()
    require(path.resolve(expressServer.path))
    log('GREEN', 'webo server side restarting')
  })
}