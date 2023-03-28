import fs from 'node:fs'
import http from 'node:http'

const __dirname = new URL('.', import.meta.url).pathname
/** @type {string} */
let weboSocketClient


/** @type {(port: number) => http.Server} */
export function createHttpServer(port) {
  weboSocketClient = fs.readFileSync(__dirname + '/webo-socket.js', 'utf8').replace('[WS_PORT]', String(port))
  return http.createServer(requestHandler).listen(port, '127.0.0.1')
}


/** @type {http.RequestListener} */
function requestHandler(req, res) {
  if (req.url === '/webo-socket.js') {
    res.setHeader('Content-Type', 'application/javascript')
    res.end(weboSocketClient)
    return
  }
  res.statusCode = 404
  res.end()
}
