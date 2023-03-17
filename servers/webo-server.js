import path from 'node:path'
import { createHttpServer } from './webo-http-server.js'
import { createWebSocketServer } from './webo-websocket-server.js'


export const port = calcUniquePort()


export let webSockets = new Set


export function createWeboServer() {
  const server = createHttpServer(port)
  const { webSockets: sockets } = createWebSocketServer(server)
  webSockets = sockets
}





function calcUniquePort() {
  // define unique webo server port per project in a deterministic way
  const localPath = path.resolve('.')
  return 36000 + localPath.split('').map(o => o.charCodeAt(0)).reduce((sum,o) => sum += o, 0) % 1000
}
