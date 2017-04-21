const path = require('path')
const serveStatic = require('serve-static')
const mime = require('mime')
const { relPath } = require('./utils')
const weboRoutes = require('./weboServer/weboRoutes')
const filesystem = require('./filesystem')
const serverWatcher = require('./watchers/serverWatcher')
const clientWatcher = require('./watchers/clientWatcher')

let config = require('./config')
let expressServer = { instance: null, path: null }


function setup(expressServerPath) {
  patchExpress()
  if (config.includeServerDirectory && !config.paths[expressServerPath]) config.paths[expressServerPath] = expressServerPath.replace(config.srcRoot + '/', '')
  if (config.layout) config.layout = relPath(config.layout)
  config.express = { root: expressServerPath }
}


function patchExpress() {
  const expressModule = require(path.resolve('node_modules/express'))

  // monkey patch express-static
  expressModule.static = function static(... args) {
    return weboStatic.apply(expressModule, args)
  }

   // monkey patch express application listen event in order to acquire http server instance
  expressModule.application.listen = function listen(... args) { 
    expressServer.instance = require('http').createServer(this);
    filesystem.ready().then(() => {
      return expressServer.instance.listen.apply(expressServer.instance, args);
    })
  }
}


function weboStatic(root) {
  filesystem.loadDirectory(root).then(added => added ? clientWatcher.watchDirectory(root, filesystem.files, config) : null)
  return (req, res, next) => {
    if (req.url.startsWith('/webo')) return weboRoutes(req, res, next)
    const content = filesystem.getFileContent(root + req.url)
    if (content) {
      const ext = req.url.split('.').pop()
      res.setHeader('Content-Type', mime.types[ext] || 'text/html');
      res.setHeader('X-Powered-By', 'webo')
      res.send(content)
    } else {
      if (!req.url.endsWith('/') && filesystem.isDirectory(root + req.url)) return res.redirect(req.url + '/')
      res.setHeader('Cache-Control', 'no-store')
      serveStatic(root)(req, res, next)
    }
  }
}



module.exports = expressServerPath => {
  setup(expressServerPath)
  expressServer.path = expressServerPath
  require(path.resolve(expressServerPath))
  serverWatcher(expressServer, Object.keys(config.paths))
}