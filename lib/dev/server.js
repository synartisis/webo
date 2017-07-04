const path = require('path')
const http = require('http')
const { promisify } = require('util')
const fs = require('fs')

const state = require('../state')
const loader = require('../loaders/loader')
const weboServer = require('./webo/weboServer')

module.exports = async function server(WS_PORT) {

  http.createServer(async (req, res) => {
    let [filename, query] = req.url.split('?')
    let ext = filename.split('.').pop()

    filename = path.join(path.resolve('.'), state.config.srcRoot, filename)
      // console.log(req.method, req.url, filename)

    let isDir = false
    try { isDir = (await promisify(fs.lstat)(filename)).isDirectory() } catch (error) { }
    if (isDir && !req.url.endsWith('/')) { res.setHeader('Location', req.url + '/'); res.statusCode = 302; return res.end() }
    if (isDir) { filename += 'index.html'; ext = 'html' }

    const content = await loader(filename, 'dev')

    if (!content && (req.url.startsWith('/webo/') || req.url === '/')) return weboServer(req, res, WS_PORT)

    if (content === null) res.statusCode = 404
    res.setHeader('Content-Type', require('mime').types[ext] || 'text/html')
    res.end(content)
  }).listen(state.config.dev.port, () => console.log('listening ' + state.config.dev.port))

}
