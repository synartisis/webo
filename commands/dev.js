const path = require('path')

const { createUserProcess } = require('../lib/process-manager.js')
const { watchServer, watchClient } = require('../lib/watchers.js')

module.exports = async function dev(config, nodeArgs) {

  const userEntryPath = path.resolve(config.userEntry)
  const userEntryUrl = new URL(`file:///${userEntryPath}`).href
  createUserProcess(userEntryUrl, nodeArgs, config)

  if (config.watchClient) {
    const { createWeboServer } = require('../servers/webo-server.js')
    createWeboServer()
    watchClient(config.clientRoots, config.cachebust)
  }

  if (config.watchServer) watchServer(config.serverRoots)

}