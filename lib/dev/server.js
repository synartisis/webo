const http = require('http')

const utils = require('../utils')
const parse = require('../parser/parse')
const weboServer = require('./webo/weboServer')
const { unhashFilename } = require('../parser/hasher')
const { state } = require('../state')
let serveStatic
try { serveStatic = require(require('path').resolve('node_modules/serve-static')) } catch(err) {}

let WS_PORT_

module.exports = async function server(WS_PORT) {
  WS_PORT_=WS_PORT

  const server = http.createServer(middleware)
  server.on('error', error => {
    if (error.code === 'EADDRINUSE') {
      const port = parseInt(state.config.dev.port) + 1
      console.log(`Port ${state.config.dev.port} is in use. Trying ${port}`)
      server.listen(port, () => console.log('listening ' + port))
    } else {
      throw error
    }
  })
  if (state.entryType !== 'express') server.listen(state.config.dev.port, () => console.log('listening ' + state.config.dev.port))
}

async function middleware(req, res, next, root) {
  
    let [ path, query ] = req.url.split('?')
    let filename = state.clientRoot + path
  
    let isDir = false
    try { isDir = (await utils.lstatAsync(filename)).isDirectory() } catch (error) { }
    if (isDir && !req.url.includes('?') && !req.url.includes('#') && !req.url.endsWith('/')) { res.setHeader('Location', req.url + '/'); res.statusCode = 302; return res.end() }

    if (isDir) filename += 'index.html'
    let ext = filename.split('.').pop()

      // console.log('1',filename, unhashFilename(filename))      

    if (req.url.startsWith('/webo/')) return weboServer(req, res, WS_PORT_)


    if (state.proc.hash) {
      filename = unhashFilename(filename)
    }
          
    res.setHeader('Content-Type', require('mime').types[ext] || 'text/html')
    const dep = state.deps.find(o => o.path === filename)
    const { content } = await parse(filename, 'dev', dep && dep.type)
    
    if (content === null && req.url === '/') return weboServer(req, res, WS_PORT_)

    if (!content) {
      const stream = require('fs').createReadStream(filename)
      stream.on('open', () => {
        return stream.pipe(res)
      })
      stream.on('error', error => {
        if (serveStatic && root) {
          return serveStatic(root)(req, res, next)
        } else {
          return next()
        }
      })
    } else {
      res.end(content)
    }

  }

  
  module.exports.middleware = middleware