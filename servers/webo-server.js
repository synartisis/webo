const { createHttpServer } = require('./webo-http-server.js')
const { createWebSocketServer } = require('./webo-websocket-server.js')


exports.port = calcUniquePort()


exports.webSockets = new Set


exports.createWeboServer = function createWeboServer() {
  const server = createHttpServer(exports.port)
  const { webSockets } = createWebSocketServer(server)
  exports.webSockets = webSockets
}





function calcUniquePort() {
  // define unique webo server port per project in a deterministic way
  const localPath = require('path').resolve('.')
  return 36000 + localPath.split('').map(o => o.charCodeAt(0)).reduce((sum,o) => sum += o, 0) % 1000
}
