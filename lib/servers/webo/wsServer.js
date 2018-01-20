const WebSocket = require('ws')

const { webSocketPort } = require('./webo-router.js')

const wsServer = new WebSocket.Server({ port: webSocketPort })
const sockets = module.exports.sockets = new Set

wsServer.on('connection', ws => {
  sockets.add(ws)
  ws.send('webo websocket connection initiated on port ' + webSocketPort)
})
wsServer.on('error', err => { 
  console.error(`Failed to establish websocket connection. Maybe you're running another instance of webo in the same project.`); 
  process.exit() 
})
