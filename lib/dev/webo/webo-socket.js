let socket
connect()

function connect() {
  socket = new WebSocket('ws://' + location.hostname + ':[WS_PORT]/webo/')
  socket.onclose = () => setTimeout(connect, 3000)

  socket.onmessage = event => {    
    const message = event.data
    console.log(message)
    if (message === 'refresh') location.reload()
  }
}
