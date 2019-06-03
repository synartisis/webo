const fs = require('fs')
const http = require('http')

let weboSocketClient

exports.createHttpServer = function createHttpServer(port) {
  weboSocketClient = fs.readFileSync(__dirname + '/webo-socket.js', 'utf8').replace('[WS_PORT]', port)
  return http.createServer(requestHandler).listen(port)
}


function requestHandler(req, res) {
  if (req.url === '/webo-socket.js') {
    res.setHeader('Content-Type', 'application/javascript')
    return res.end(weboSocketClient)
  }
  res.statusCode = 404
  res.end()
}
