const path = require('path')
const { relPath, log } = require('./utils')
const weboStatic = require('./weboServer/server')
const serverWatcher = require('./watchers/serverWatcher')

let config = require('./config')


function setup(expressServerPath) {
  patchExpress()
  if (config.includeServerDirectory && !config.paths[expressServerPath]) config.paths[expressServerPath] = expressServerPath.replace(config.srcRoot + '/', '')
  if (config.layout) config.layout = relPath(config.layout)
  config.express = { root: expressServerPath }
}

function patchExpress() {
  const express = require(require('path').resolve('node_modules/express'))
  express.static = weboStatic // monkey patch express-static
}


module.exports = expressServerPath => {
  setup(expressServerPath)
  const expressServer = require(path.resolve(expressServerPath))
  if (!expressServer.close) {
    log('RED', 'Server not found.', 'RESET', `\nYou must export your server at ${require.resolve(path.resolve(expressServerPath))}\nexample: `, 'YELLOW', 'module.exports = app.listen(...)')
    process.exit()
  }
  serverWatcher(expressServer, expressServerPath, Object.keys(config.paths))
}