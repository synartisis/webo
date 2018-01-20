const WebSocket = require('ws')

const webSockets = new Set

function startWebSocketServer(port) {

  const wsServer = new WebSocket.Server({ port })
  
  wsServer.on('connection', ws => {
    webSockets.add(ws)
    ws.send('webo websocket connection initiated on port ' + port)
  })
  wsServer.on('error', err => { 
    console.error(`Failed to establish websocket connection. Maybe you're running another instance of webo in the same project.`); 
    process.exit() 
  })

}


module.exports = {
  webSockets,
  startWebSocketServer,
}