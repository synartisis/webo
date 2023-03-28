import WebSocket from 'ws'


/** @type {(server: any) => { wsServer: WebSocket.Server<WebSocket.WebSocket>, webSockets: Set<WebSocket.WebSocket>}} */
export function createWebSocketServer(server) {

  const wsServer = new WebSocket.Server({ server })
  const webSockets = new Set
  
  wsServer.on('connection', ws => {
    webSockets.add(ws)
    ws.send('webo websocket connection initiated')
  })
  wsServer.on('error', err => { 
    console.error(`Failed to establish websocket connection. Maybe you're running another instance of webo in the same project.`); 
    process.exit() 
  })

  return { wsServer, webSockets }

}
