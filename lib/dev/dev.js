const sh = require('shelljs')

const state = require('../state')
const server = require('./server')
const watchers = require('./watchers')

const { WS_PORT, sockets } = require('./wsServer')


module.exports = async () => {
  
  // console.log(state)
  server(WS_PORT)
  watchers.init(sockets)

}
