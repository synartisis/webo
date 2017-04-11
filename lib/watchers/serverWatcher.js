const path = require('path')
const chokidar = require('chokidar')


module.exports = (expressServer, expressServerPath, paths, extensions = ['js']) => {
  const watcher = chokidar.watch(paths)

  watcher.on('change', async filepath => {
    const absPath = path.resolve(filepath)
    // console.log(absPath, path.resolve(expressServerPath))
    delete require.cache[absPath]
    delete require.cache[require.resolve(path.resolve(expressServerPath))]
    // delete require.cache[path.join(path.resolve(expressServerPath), 'index.js')]
    expressServer.close()
    expressServer = require(path.resolve(expressServerPath))
    console.log(`${COLORS.GREEN}webo server side restarting${COLORS.RESET}`)
  })
}