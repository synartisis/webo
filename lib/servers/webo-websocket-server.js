import * as ws from 'ws'


/** @type {(server: any) => { wsServer: ws.Server, webSockets: Set<ws.WebSocket>}} */
export function createWebSocketServer(server) {

  const wsServer = new ws.WebSocketServer({ server })
  const webSockets = new Set
  
  wsServer.on('connection', socket => {
    webSockets.add(socket)
    socket.send('webo websocket connection initiated')
  })
  wsServer.on('error', err => { 
    console.error(`Failed to establish websocket connection. Maybe you're running another instance of webo in the same project.`); 
    process.exit() 
  })

  return { wsServer, webSockets }

}
