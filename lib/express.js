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
      delay().then(() => clientWatcher.watchDirectories([... memfs.roots]))
      ready = true
      return expressServer.instance.listen.apply(expressServer.instance, args)
    })
  }
}


function weboStatic(root) {
  memfs.attachDirectory(root)
  return (req, res, next) => {
    if (req.url.startsWith('/webo')) return require('./weboServer/weboRoutes')(req, res, next)

    let [ path, query ] = req.url.split('?')
    filepath = root + path
    let file = memfs.getFile(filepath)
    if (!file) {
      if (memfs.isDirectory(filepath) && !filepath.endsWith('/')) return res.redirect(path + '/?' + (query || ''))
      file = memfs.getFile(filepath + (filepath.endsWith('/') ? '' : '/') + 'index.html')
    }

    if (file && file.content) {
      const ext = req.url.split('.').pop()
      res.setHeader('Content-Type', require('mime').types[ext] || 'text/html');
      res.setHeader('X-Powered-By', 'webo')
      res.send(file.content)
    } else {
      res.setHeader('Cache-Control', 'no-store')
      require('serve-static')(root)(req, res, next)
    }
  }
}



module.exports = expressServerPath => {
  setup(expressServerPath)
  expressServer.path = expressServerPath
  require(path.resolve(expressServerPath))
  memfs.ready().then(() => serverWatcher(expressServer, Object.keys(config.paths)))
}