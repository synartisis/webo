const path = require('path')
const { relPath, delay, waitUntil } = require('./utils')
const memfs = require('./memfs')
const serverWatcher = require('./watchers/serverWatcher')
const clientWatcher = require('./watchers/clientWatcher')

let config = require('./config')
let expressServer = { instance: null, path: null }
let ready = false


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

   // monkey patch express application listen event
  expressModule.application.listen = function listen(... args) { 
    expressServer.instance = require('http').createServer(this);
    memfs.loadAll()
    .then(() => {
      delay().then(() => clientWatcher.watchDirectories(memfs.roots))
      ready = true
      return expressServer.instance.listen.apply(expressServer.instance, args)
    })
  }
}


function weboStatic(root) {
  memfs.attachDirectory(root)
  return (req, res, next) => {
    const serveStatic = require('serve-static')
    const mime = require('mime')
    const weboRoutes = require('./weboServer/weboRoutes')
    if (req.url.startsWith('/webo')) return weboRoutes(req, res, next)
    const content = memfs.getFileContent(root + req.url)
    if (content) {
      const ext = req.url.split('.').pop()
      res.setHeader('Content-Type', mime.types[ext] || 'text/html');
      res.setHeader('X-Powered-By', 'webo')
      res.send(content)
    } else {
      if (!req.url.endsWith('/') && memfs.isDirectory(root + req.url)) return res.redirect(req.url + '/')
      res.setHeader('Cache-Control', 'no-store')
      serveStatic(root)(req, res, next)
    }
  }
}



module.exports = expressServerPath => {
  setup(expressServerPath)
  expressServer.path = expressServerPath
  require(path.resolve(expressServerPath))
  waitUntil(() => ready, 1000).then(() => serverWatcher(expressServer, Object.keys(config.paths)))
}