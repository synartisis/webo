(function() {
  
  var socket
  connect()
  
  /** @type {(reconnect?: boolean) => void} */
  function connect(reconnect = false) {
    socket = new WebSocket('ws://' + location.hostname + ':[WS_PORT]/')
    socket.onclose = function() { setTimeout(function() { connect(true) }, 3000) }
  
    socket.onmessage = function(event) {
      var message = event.data
      if (message === 'reload') return location.reload()
      if (!/^changed /.test(message)) return console.log(message)
      var filename = message.replace('changed ', '')
      var ext = filename.split('.').pop()
      if (ext === 'css') {
        var csslink = document.querySelector('link[rel="stylesheet"][href*="' + filename + '"]')
        if (csslink) {
          var href = csslink.getAttribute('href')
          if (!href) return
          if (href.indexOf('webo-ver') !== -1) {
            href = href.substring(0, href.indexOf('webo-ver') + 9)
          } else {
            href.indexOf('?') === -1 ? href += '?webo-ver=' : href += '&webo-ver='
          }
          csslink.setAttribute('href', href + new Date().getTime())
        }
      } else {
        location.reload()
      }
    }
  
    if (reconnect) location.reload()
  }
 
})()
  

window.addEventListener('error', function(evt) {
  /** @type {HTMLDivElement?} */
  var weboErrorEl = document.querySelector('#webo-error')
  if (!weboErrorEl) {
    weboErrorEl = document.createElement('div')
    Object.assign(weboErrorEl.style, {
      display: 'block',
      position: 'fixed',
      bottom: 0,
      width: '100%',
      color: 'darkred',
      padding: '2rem',
      background: 'rgba(191, 150, 150, 0.3)',
      whiteSpace: 'pre'
    })
    document.body.appendChild(weboErrorEl)
    weboErrorEl.addEventListener('click', function() { this.style.display = 'none' })
  }
  weboErrorEl.textContent = evt.error.stack || evt.error.message
})
