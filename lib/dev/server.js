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
  if (state.entryType !== 'express') server.listen(state.config.dev.port, () => console.log('listening ' + state.config.dev.port))
}

async function middleware(req, res, next) {

    let [ path, query ] = req.url.split('?')

    let filename = state.config.srcRoot + path
    let isDir = false
    try { isDir = (await utils.lstatAsync(filename)).isDirectory() } catch (error) { }
    if (isDir && !req.url.endsWith('/')) { res.setHeader('Location', req.url + '/'); res.statusCode = 302; return res.end() }

    // let filename = path.substring(1)
    if (isDir) filename += 'index.html'
    let ext = filename.split('.').pop()

      // console.log('1',filename, unhashFilename(filename))      

    if (req.url.startsWith('/webo/')) return weboServer(req, res, WS_PORT_)

       

      // filename = utils.resolvePath(state.config.srcRoot, filename)
    // filename = path.join(path.resolve('.'), state.config.srcRoot, filename)
      // console.log(req.method, req.url, filename)


    // if (isDir && !req.url.endsWith('/')) { res.setHeader('Location', req.url + '/'); res.statusCode = 302; return res.end() }
// console.log('2',req.url, isDir)      

    if (state.proc.hash) {
      // console.log(filename, filename = unhashFilename(filename))
      filename = unhashFilename(filename)
      // console.log('1',filename)      
      //       filename = filename.substring(0, filename.lastIndexOf('-')) + ext ? '.' + ext : ''
      //       console.log('2',filename)      
      //       // const dep = state.deps.find(o => o.pathHashed === filename)
      //       // if (dep) filename = dep.path
    }
          

    res.setHeader('Content-Type', require('mime').types[ext] || 'text/html')
    // if (!loader.loaders.includes(ext)) return require('fs').createReadStream(filename).pipe(res)
    const { content } = await parse(filename, 'dev')

    if (!content && req.url === '/') return weboServer(req, res, WS_PORT_)

    if (!content) {
      // filename = content.split(':').pop()
// console.log('RAW', filename)
      const stream = require('fs').createReadStream(filename)
      stream.on('error', error => {
        console.log(error)
        if (next) return next()
      })
      return stream.pipe(res)
    }
    
    if (content === null) return next()
    // if (content === null) res.statusCode = 404
    res.end(content)



  }

  module.exports.middleware = middleware