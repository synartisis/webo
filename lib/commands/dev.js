import path from 'node:path'
import { createUserProcess } from '../processes/process-manager.js'
import { watchServer, watchClient } from '../utils/watchers.js'
import { createWeboServer } from '../servers/webo-server.js'


/** @type {(config: Webo.Config, nodeArgs: string) => Promise<Webo.CommandResult>} */
export default async function dev(config, nodeArgs) {

  const userEntryPath = path.resolve(config.userEntry)
  const userEntryUrl = new URL(`file:///${userEntryPath}`).href
  const userProcess = createUserProcess(userEntryUrl, nodeArgs, config)
  
  if (config.watchClient) {
    createWeboServer()
    watchClient(config.clientRoots, config.cachebust)
  }

  if (config.watchServer) watchServer(config.serverRoots)

  return new Promise(resolve => {
    process.on('SIGINT', () => {
      log('\r_GREEN_webo ended by user');
      userProcess.kill();
      resolve({ exitCode: 0, message: '' })
    })
  })

}

