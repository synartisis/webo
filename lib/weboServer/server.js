const serveStatic = require('serve-static')
const mime = require('mime')
const { context } = require('../filesystem/utils')
const filesystem = require('../filesystem')
const { readFileSync } = require('fs')
const weboScript = readFileSync(__dirname + '/webo-script.js', 'utf-8')

const config = require('../config')

function weboRoutes(req, res, next) {
  if (req.url === '/webo/webo.js') { res.setHeader('Content-Type', 'application/javascript'); return res.send(weboScript) }
  if (req.url === '/webo/api') return res.send({ context, roots: filesystem.roots, fileCount: filesystem.files.length, config, bundleRoots: filesystem.bundleRoots, files: filesystem.files })
  if (req.url === '/webo/api/files') return res.send(filesystem.files)
  if (req.url === '/webo/build') return res.send(build(filesystem.roots, filesystem.files))
  req.url = req.url.replace('/webo', '/')
  return serveStatic(__dirname + '/../weboClient/')(req, res, next) 
}

function weboStatic(root) {
  filesystem.loadDirectory(root)
  return (req, res, next) => {
    if (req.url.startsWith('/webo')) return weboRoutes(req, res, next)
    const content = filesystem.getFileContent(root + req.url)
    if (content) {
      const ext = req.url.split('.').pop()
      res.setHeader('Content-Type', mime.types[ext] || 'text/html');
      res.setHeader('X-Powered-By', 'webo')
      res.send(content)
    } else {
      res.setHeader('cache-control', 'no-store')
      serveStatic(root)(req, res, next)
    }
  }
}

module.exports = weboStatic