// DEVO injected script
let socket
connect()


function connect() {
  const devoPath = document.querySelector('script[src="/devo/devo.js"]').getAttribute('devo-path')
  socket = new WebSocket('ws://' + location.hostname + ':3737?path=' + encodeURIComponent(devoPath))
  socket.onclose = () => setTimeout(connect, 3000)

  socket.onmessage = event => {
    const { action, url } = JSON.parse(event.data)
    if (action === 'refresh') return location.reload()
    if (action === 'inline') {
      if (url.endsWith('.css')) {
        const el = document.querySelector(`link[href="${url}"]`)
        if (el) el.href = url
      }
      if (url.endsWith('.js')) {
        const el = document.querySelector(`script[src="${url}"]`)
        const updated = document.createElement('script')
        updated.src = url
        if (el.getAttribute('devo')) updated.setAttribute('devo', el.getAttribute('devo'))
        el.parentNode.insertBefore(updated, el)
        el.parentNode.removeChild(el)
      }
      if (url.endsWith('.png')) {
        const el = document.querySelector(`img[src="${url}"]`)
        if (el) el.src = url
      }
    }
  }
}