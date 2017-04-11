const path = require('path')
const chokidar = require('chokidar')


module.exports = (expressServer, expressServerPath, paths, extensions = ['js']) => {
  const watcher = chokidar.watch(paths)

  watcher.on('change', async filepath => {
    const absPath = path.resolve(filepath)
    // console.log(absPath, path.resolve(expressServerPath))
    // console.log(Object.keys(require.cache).filter(o => !o.includes('node_modules') && !o.includes('webo')))
    Object.keys(require.cache).filter(o => !o.includes('node_modules') && !o.includes('webo')).forEach(o => delete require.cache[o])
    // console.log(Object.keys(require.cache).filter(o => !o.includes('node_modules') && !o.includes('webo')))
    // delete require.cache[absPath]
    // delete require.cache[require.resolve(path.resolve(expressServerPath))]
    expressServer.close()
    expressServer = require(path.resolve(expressServerPath))
    console.log(`${COLORS.GREEN}webo server side restarting${COLORS.RESET}`)
  })
}