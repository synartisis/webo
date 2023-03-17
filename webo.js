import path from 'node:path'
import { setGlobals } from './lib/utils.js'
import { detectProjectType } from './lib/detect-project-type.js'
import { version } from './commands/config.js'
import { detectRoots } from './lib/detect-roots.js'
import dev from './commands/dev.js'
import build from './commands/build.js'
import configCommand from './commands/config.js'

export async function webo(config, nodeArgs) {

  setGlobals(config.verbose)

  if (['dev', 'build'].includes(config.command)) {
    log(`_GREEN_WEBO ${version} started`)
  }

  config.projectType = await detectProjectType(config)
  if (config.projectType === 'static' && !config.clientRoots.length) config.clientRoots = [ path.resolve(config.userEntry) ] 

  if (config.serverRoots.length === 0 && config.clientRoots.length === 0) {
    Object.assign(config, await detectRoots(config.userEntry))
  }

  if (config.showConfig) console.dir(config)

  let result

  if (config.command === 'config') {
    result = await configCommand(config, nodeArgs)
  }

  if (config.command === 'dev') {
    result = await dev(config, nodeArgs)
  }

  if (config.command === 'build') {
    result = await build(config)
  }


  if (result) {
    if (result.exitCode) {
      console.error(result.message || result)
      process.exit(result.exitCode)
    } else {
      typeof result === 'object' ? log(result) : log(`_GREEN_${result}`)
    }
  }

}