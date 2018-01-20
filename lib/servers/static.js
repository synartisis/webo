const http = require('http')
const path = require('path')
const fs = require('fs')
const { log, getMimeType, isDirectory } = require('../utils/utils.js')
const weboMiddleware = require('./webo/webo-middleware.js')


module.exports = async function static(mode, root, port = 3000) {

  const server = http.createServer(async (req, res) => {

    const handled = await weboMiddleware(req, res, root)

    if (!handled) {
      let filename = req.url.split('?')[0]
      res.setHeader('Content-Type', getMimeType(filename))
      res.setHeader('X-Powered-By', 'webo-static')
      const stream = fs.createReadStream(path.posix.join(root, filename))
      stream.on('open', () => stream.pipe(res))
      stream.on('error', () => { 
        log('_RED_error reading ', filename); 
        res.statusCode = 404
        res.end() 
      })
    }

  })

  // if (mode === 'dev') server.listen(port, () => log('_GREEN_webo static server listening at ' + port))
  server.listen(port, () => log('_GREEN_webo static server listening at ' + port))

}