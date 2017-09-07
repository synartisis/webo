(function() {

  var socket
  connect()
  
  function connect(reconnect) {
    socket = new WebSocket('ws://' + location.hostname + ':[WS_PORT]/webo/')
    socket.onclose = function() { setTimeout(function() { connect(true) }, 3000) }
  
    socket.onmessage = function(event) {    
      var message = event.data
      console.log(message)
      if (message === 'refresh') location.reload()
    }
  
    if (reconnect) location.reload()
  }
  
})()
