(function() {

  var socket
  connect()
  
  function connect(reconnect) {
    socket = new WebSocket('ws://' + location.hostname + ':[WS_PORT]/webo/')
    socket.onclose = function() { setTimeout(function() { connect(true) }, 3000) }
  
    socket.onmessage = function(event) {    
      var message = event.data
      if (message === 'refresh') location.reload()
      if (message.split('.').pop() === 'css') {
        var csslink = document.querySelector('link[rel="stylesheet"][href*="' + message.split('/').pop() + '"]')
        if (csslink) {
          var href = csslink.getAttribute('href')
          if (href.indexOf('webo-ver') !== -1) {
            href = href.substring(0, href.indexOf('webo-ver') + 9)
          } else {
            href.indexOf('?') === -1 ? href += '?webo-ver=' : href += '&webo-ver='
          }
          csslink.setAttribute('href', href + new Date().getTime())
        }
      }
    }
  
    if (reconnect) location.reload()
  }
  
})()
