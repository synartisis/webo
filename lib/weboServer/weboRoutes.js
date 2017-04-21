const serveStatic = require('serve-static')
const { context } = require('../utils')
const filesystem = require('../filesystem')
const build = require('../build')
const { readFileSync } = require('fs')
const weboScript = readFileSync(__dirname + '/webo-script.js', 'utf-8')
const vueScript = readFileSync(require.resolve('vue/dist/vue'), 'utf-8')

const config = require('../config')

async function weboRoutes(req, res, next) {
  if (req.url === '/webo/webo.js') { res.setHeader('Content-Type', 'application/javascript'); return res.send(weboScript) }
  if (req.url === '/webo/vue.js') { res.setHeader('Content-Type', 'application/javascript'); return res.send(vueScript) }
  if (req.url === '/webo/api') return res.send({ context, roots: filesystem.roots, fileCount: filesystem.files.length, config, files: filesystem.files })
  if (req.url === '/webo/api/config') return res.send({ context, roots: filesystem.roots, fileCount: filesystem.files.length, config })
  if (req.url === '/webo/api/files') return res.send(filesystem.files)
  if (req.url === '/webo/build') { await filesystem.ready(); return res.send(build(filesystem.roots, filesystem.files)) }
  req.url = req.url.replace('/webo', '/')
  return serveStatic(__dirname + '/../weboClient/')(req, res, next) 
}

module.exports = weboRoutes