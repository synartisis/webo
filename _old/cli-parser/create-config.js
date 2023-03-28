import { createRequire } from 'node:module'
import { getConfig } from '../webo-config.js'
import { weboFlags } from './webo-flags.js'

const require = createRequire(import.meta.url)

/** @type {(configOptions: { command: Webo.Command, userEntry: string, weboArgs: any }) => Webo.Config} */
export function createConfig({ command, userEntry, weboArgs }) {
  const defaultConfig = getConfig(command)
  const config = { ...defaultConfig, userEntry }

  // apply weboArgs to config
  Object.keys(weboArgs).forEach(weboArg => weboFlags(config)[weboArg] = weboArgs[weboArg])
  const validationErrors = validateConfig(config)
  if (validationErrors) {
    console.error(validationErrors)
    process.exit(1)
  }

  // console.debug({ cliArgs: { command, userEntry, weboArgs, nodeArgs }, config })
  return config
}


/** @type {(config: Webo.Config) => string} */
function validateConfig(config) {
  let result = ''

  // if (config.bundle) result += checkForMissingDeps('rollup', '--bundle')
  if (config.transpile || config.legacy) {
    result += checkForMissingDeps('@babel/core', '--transpile')
    result += checkForMissingDeps('@babel/preset-env', '--transpile')
    result += checkForMissingDeps('@babel/polyfill', '--transpile')
  }
  if (config.minify) result += checkForMissingDeps('terser', '--minify')

  return result
}

/** @type {(moduleName: string, switchName: string) => string} */
function checkForMissingDeps(moduleName, switchName) {
  try {
    require.resolve(moduleName, { paths: [ process.cwd() ] })
    return ''
  } catch (error) {
    return `To use ${switchName} switch you must install ${moduleName}. Run 'npm i -D ${moduleName}'\n`
  }
}