const path = require('path')
const { setGlobals } = require('./lib/utils.js')
const { detectProjectType } = require('./lib/detect-project-type.js')

exports.webo = async function webo(config, nodeArgs) {

  setGlobals(config.verbose)

  if (['dev', 'build'].includes(config.command)) {
    log(`_GREEN_WEBO ${require('./package.json').version} started`)
  }

  config.projectType = await detectProjectType(config)
  if (config.projectType === 'static' && !config.clientRoots.length) config.clientRoots = [ path.resolve(config.userEntry) ] 

  if (config.serverRoots.length === 0 && config.clientRoots.length === 0) {
    const { detectRoots } = require('./lib/detect-roots.js')
    Object.assign(config, await detectRoots(config.userEntry))
  }

  if (config.showConfig) console.dir(config)

  let result

  if (config.command === 'config') {
    result = await require('./commands/config.js')(config, nodeArgs)
  }

  if (config.command === 'dev') {
    result = await require('./commands/dev.js')(config, nodeArgs)
  }

  if (config.command === 'build') {
    result = await require('./commands/build.js')(config)
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