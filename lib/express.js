const path = require('path')
const { relPath } = require('./filesystem/utils')
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

function merge(dest = {}, src) {
  for (const prop in src) {
    if (!dest[prop] || !dest.hasOwnProperty(prop)) { dest[prop] = src[prop]; continue; }
    if (Array.isArray(dest[prop]) && Array.isArray(src[prop])) { dest[prop].push(... src[prop]); continue; }
    if (typeof dest[prop] === 'object')  { merge(dest[prop], src[prop]); continue; }
    dest[prop] = src[prop]
  }
}


module.exports = (userConfig, expressServerPath) => {
  merge(config, userConfig)
  setup(expressServerPath)
  expressServer.path = expressServerPath
  require(path.resolve(expressServerPath))
  serverWatcher(expressServer, Object.keys(config.paths))
}