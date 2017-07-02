const WebSocket = require('ws')

// define unique websocket port per project in a deterministic way
const LOCAL_PATH = require('path').resolve('.')
const WS_PORT = 36000 + LOCAL_PATH.split('').map(o => o.charCodeAt(0)).reduce((sum,o) => sum += o, 0) % 1000
const wsServer = new WebSocket.Server({ port: WS_PORT })
const sockets = new Set

wsServer.on('connection', ws => {
  sockets.add(ws)
  ws.send('webo websocket connection initiated on port ' + WS_PORT)
})
wsServer.on('error', err => { 
  console.error(`Failed to establish websocket connection. Maybe you're running another instance of webo in the same project.`); 
  process.exit() 
})


module.exports = {
  WS_PORT,
  sockets,
}