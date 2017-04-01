const serveStatic = require('serve-static')
const filesystem = require('../filesystem')
const { context } = require('../filesystem/utils')
const build = require('../build')
const { relPath } = require('../filesystem/utils')
let initialized = false

let config = require('../config')


function weboRoutes(req, res, next) {
  if (req.url === '/webo/api') return res.send({ context, roots: filesystem.roots, fileCount: filesystem.files.length, config, bundleRoots: filesystem.bundleRoots, files: filesystem.files })
  if (req.url === '/webo/api/files') return res.send(filesystem.files)
  if (req.url === '/webo/build') return res.send(build(filesystem.roots, filesystem.files))
  req.url = req.url.replace('/webo', '/')
  return serveStatic(__dirname + '/../client/')(req, res, next) 
}

function weboStatic(root) {
  filesystem.loadDirectory(root)
  return (req, res, next) => {
    if (req.url.startsWith('/webo')) return weboRoutes(req, res, next)
    const content = filesystem.getFileContent(root + req.url)
    if (content) {
      res.setHeader('X-Powered-By', 'webo')
      res.send(content)
    } else {
      res.setHeader('cache-control', 'no-store')
      serveStatic(root)(req, res, next)
    }
  }
}

function initialize() {
  const expressModule = module.parent.parent.children.find(o => o.id.replace(/\\/g, '/').includes('/node_modules/express/'))
  expressModule.exports.static = weboStatic
  const serverPath = require('path').dirname(relPath(module.parent.parent.filename))
  if (config.includeServerDirectory && !config.paths[serverPath]) config.paths[serverPath] = serverPath.replace(config.srcRoot + '/', '')
  initialized = true
}

function merge(dest = {}, src) {
  for (const prop in src) {
    if (!dest[prop] || !dest.hasOwnProperty(prop)) { dest[prop] = src[prop]; continue; }
    if (Array.isArray(dest[prop]) && Array.isArray(src[prop])) { dest[prop].push(... src[prop]); continue; }
    if (typeof dest[prop] === 'object')  { merge(dest[prop], src[prop]); continue; }
    dest[prop] = src[prop]
  }
}


function expressConfig(cnf) {
  merge(config, cnf)
  if (!initialized) initialize()
  return (req, res, next) => next()
}


module.exports = expressConfig
