import path from 'node:path'
import { createUserProcess } from '../lib/process-manager.js'
import { watchServer, watchClient } from '../lib/watchers.js'
import { createWeboServer } from '../servers/webo-server.js'

export default async function dev(config, nodeArgs) {

  const userEntryPath = path.resolve(config.userEntry)
  const userEntryUrl = new URL(`file:///${userEntryPath}`).href
  createUserProcess(userEntryUrl, nodeArgs, config)

  if (config.watchClient) {
    createWeboServer()
    watchClient(config.clientRoots, config.cachebust)
  }

  if (config.watchServer) watchServer(config.serverRoots)

}