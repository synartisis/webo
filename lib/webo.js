import path from 'node:path'
import { setGlobals } from './utils/utils.js'
import { detectProjectType } from './utils/autodetect.js'
import { detectRoots } from './utils/autodetect.js'
import configCommand from './commands/config.js'
import dev from './commands/dev.js'
import build from './commands/build.js'
import deploy from './commands/deploy.js'


/** @type {(config: Webo.Config, nodeArgs: any) => Promise<Webo.CommandResult>} */
export async function webo(config, nodeArgs) {

  setGlobals(config.verbose)

  if (['dev', 'build', 'deploy'].includes(config.command)) {
    log(`_GREEN_WEBO ${config.version} started`)
  }

  config.projectType = await detectProjectType(config)
  if (config.projectType === 'static' && !config.clientRoots.length) config.clientRoots = [ path.resolve(config.userEntry) ] 

  if (config.serverRoots.length === 0 && config.clientRoots.length === 0) {
    Object.assign(config, await detectRoots())
  }

  if (config.showConfig) console.dir(config)

  /** @type {Webo.CommandResult} */
  let result = { exitCode: 0, message: '' }

  if (config.command === 'config') {
    result = await configCommand(config, nodeArgs)
  }

  if (config.command === 'dev') {
    result = await dev(config, nodeArgs)
  }

  if (config.command === 'build') {
    result = await build(config)
  }

  if (config.command === 'deploy') {
    result = await deploy(config)
  }

  return result
  
}