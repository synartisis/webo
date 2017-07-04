const sh = require('shelljs')

const state = require('../state')
const server = require('./server')
const watcher = require('./watcher')

const { WS_PORT, sockets } = require('./wsServer')


module.exports = async () => {
  
  // console.log(state)
  server(state.entries, WS_PORT)
  watcher(state.entries, sockets)

}
