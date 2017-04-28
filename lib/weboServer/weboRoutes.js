const serveStatic = require('serve-static')
const { context } = require('../utils')
const memfs = require('../memfs')
const { readFileSync } = require('fs')
const weboScript = readFileSync(__dirname + '/webo-script.js', 'utf-8')
const vueScript = readFileSync(require.resolve('vue/dist/vue'), 'utf-8')

const config = require('../config')

async function weboRoutes(req, res, next) {
  const build = require('../build')
  if (req.url === '/webo/webo.js') { res.setHeader('Content-Type', 'application/javascript'); return res.send(weboScript) }
  if (req.url === '/webo/vue.js') { res.setHeader('Content-Type', 'application/javascript'); return res.send(vueScript) }
  if (req.url === '/webo/api') return res.send({ context, roots: require('../memfs').roots, fileCount: require('../memfs').files.length, config, files: require('../memfs').files })
  if (req.url === '/webo/api/config') return res.send({ context, roots: require('../memfs').roots, fileCount: require('../memfs').files.length, config })
  if (req.url === '/webo/api/files') return res.send(require('../memfs').files)
  if (req.url === '/webo/build') { await memfs.ready(); return res.send(build([... memfs.roots], memfs.files)) }
  req.url = req.url.replace('/webo', '/')
  return serveStatic(__dirname + '/../weboClient/')(req, res, next) 
}

module.exports = weboRoutes