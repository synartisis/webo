const http = require('http')

const utils = require('../utils')
const parse = require('../parser/parse')
const weboServer = require('./webo/weboServer')
const { unhashFilename } = require('../parser/hasher')
const { state } = require('../state')

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

async function middleware(req, res, next) {

    let [ path, query ] = req.url.split('?')
    let filename = state.clientRoot + path
  
    let isDir = false
    try { isDir = (await utils.lstatAsync(filename)).isDirectory() } catch (error) { }
    if (isDir && !req.url.endsWith('/')) { res.setHeader('Location', req.url + '/'); res.statusCode = 302; return res.end() }

    if (isDir) filename += 'index.html'
    let ext = filename.split('.').pop()

      // console.log('1',filename, unhashFilename(filename))      

    if (req.url.startsWith('/webo/')) return weboServer(req, res, WS_PORT_)


    if (state.proc.hash) {
      filename = unhashFilename(filename)
    }
          
    res.setHeader('Content-Type', require('mime').types[ext] || 'text/html')
    const { content } = await parse(filename, 'dev')
    
    if (content === null && req.url === '/') return weboServer(req, res, WS_PORT_)

    if (!content) {
      const stream = require('fs').createReadStream(filename)
      stream.on('error', error => {
        if (next) {
          next()
        } else {
          res.statusCode = 404
          res.end()
        }
      })
      return stream.pipe(res)
    }
    
    if (content === null) return next()
    res.end(content)

  }

  
  module.exports.middleware = middleware