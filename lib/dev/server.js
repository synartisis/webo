const http = require('http')

const utils = require('../utils')
const { state } = require('../state')
const loader = require('../loaders/loader')
const weboServer = require('./webo/weboServer')

let WS_PORT_

module.exports = async function server(WS_PORT) {
  WS_PORT_=WS_PORT

  const server = http.createServer(middleware)
  if (!state.express) server.listen(state.config.dev.port, () => console.log('listening ' + state.config.dev.port))

}

async function middleware(req, res, next) {

    let [ path, query ] = req.url.split('?')
    // let filename = path.substring(1)
    let filename = state.config.srcRoot + path
    let ext = filename.split('.').pop()

    // console.log('***', filename, state.config.srcRoot)
    // filename = utils.resolvePath(state.config.srcRoot, filename)
    // filename = path.join(path.resolve('.'), state.config.srcRoot, filename)
      // console.log(req.method, req.url, filename)

    let isDir = false
    try { isDir = (await utils.lstatAsync(filename)).isDirectory() } catch (error) { }
    if (isDir && !req.url.endsWith('/')) { res.setHeader('Location', req.url + '/'); res.statusCode = 302; return res.end() }
    if (isDir) { filename += 'index.html'; ext = 'html' }

    res.setHeader('Content-Type', require('mime').types[ext] || 'text/html')
    // if (!loader.loaders.includes(ext)) return require('fs').createReadStream(filename).pipe(res)
    const content = await loader(filename, 'dev')

    if (!content && (req.url.startsWith('/webo/') || req.url === '/')) return weboServer(req, res, WS_PORT_)

    if (content === 'WEBO_RAW') {
      if (next) return next()
      const stream = require('fs').createReadStream(filename)
      stream.on('error', () => null)
      return stream.pipe(res)
    }
    
    if (content === null) return next()
    // if (content === null) res.statusCode = 404
    res.end(content)



  }

  module.exports.middleware = middleware