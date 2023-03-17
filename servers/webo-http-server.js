import fs from 'node:fs'
import http from 'node:http'

const __dirname = new URL('.', import.meta.url).pathname
let weboSocketClient

export function createHttpServer(port) {
  weboSocketClient = fs.readFileSync(__dirname + '/webo-socket.js', 'utf8').replace('[WS_PORT]', port)
  return http.createServer(requestHandler).listen(port, '127.0.0.1')
}


function requestHandler(req, res) {
  if (req.url === '/webo-socket.js') {
    res.setHeader('Content-Type', 'application/javascript')
    return res.end(weboSocketClient)
  }
  res.statusCode = 404
  res.end()
}
