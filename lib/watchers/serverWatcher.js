const path = require('path')
const chokidar = require('chokidar')
const { log } = require('../utils')


module.exports = (expressServer, paths) => {
  const watcher = chokidar.watch(paths, { ignoreInitial: true, cwd: '.' })
  log('VERBOSE', 'WATCHING SERVER', paths.join(', '))

  watcher.on('change', async filepath => {
    // console.log(Object.keys(require.cache).filter(o => !o.includes('node_modules') && !o.includes('/webo/') && !o.includes('\\webo\\')))
    Object.keys(require.cache).filter(o => !o.includes('node_modules') && !o.includes('/webo/') && !o.includes('\\webo\\') && o !== 'webo.config.js').forEach(o => delete require.cache[o])
    expressServer.instance.close()
    require(path.resolve(expressServer.path))
    log('GREEN', 'webo server side restarting')
  })
}