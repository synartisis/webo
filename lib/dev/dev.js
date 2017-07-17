const watchers = require('./watchers')
const { WS_PORT, sockets } = require('./wsServer')


module.exports = async () => {
  
  const server = require('./server')
  server(WS_PORT)
  watchers.init(sockets)

}
