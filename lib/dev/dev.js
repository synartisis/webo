const sh = require('shelljs')

const server = require('./server')
const watchers = require('./watchers')

const { WS_PORT, sockets } = require('./wsServer')


module.exports = async () => {
  
  server(WS_PORT)
  watchers.init(sockets)

}
