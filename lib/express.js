const path = require('path')
const { relPath, log } = require('./utils')
const weboStatic = require('./weboServer/server')
const serverWatcher = require('./watchers/serverWatcher')

let config = require('./config')
let expressServer = { instance: null, path: null }


function setup(expressServerPath) {
  patchExpress()
  if (config.includeServerDirectory && !config.paths[expressServerPath]) config.paths[expressServerPath] = expressServerPath.replace(config.srcRoot + '/', '')
  if (config.layout) config.layout = relPath(config.layout)
  config.express = { root: expressServerPath }
}

function patchExpress() {
  const express = require(require('path').resolve('node_modules/express'))
   // monkey patch express application listen event in order to acquire http server instance
  express.application.listen = function listen(... args) { 
    expressServer.instance = require('http').createServer(this);
    return expressServer.instance.listen.apply(expressServer.instance, args);
  }
  express.static = weboStatic // monkey patch express-static
}


module.exports = expressServerPath => {
  setup(expressServerPath)
  expressServer.path = expressServerPath
  require(path.resolve(expressServerPath))
  serverWatcher(expressServer, Object.keys(config.paths))
}