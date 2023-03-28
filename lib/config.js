import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { parseArgs } from 'node:util'

const require = createRequire(import.meta.url)
const version = await getVersion()

/** @type {() => { config: Webo.Config, nodeArgs: string }} */
export function createConfig() {
  const { values, command, userEntry, nodeArgs } = getUserOptions()
  const overrides = configOverrides[command]
  renameProperty(values, 'server-root', 'serverRoots')
  renameProperty(values, 'client-root', 'clientRoots')
  renameProperty(values, 'watch-server', 'watchServer')
  renameProperty(values, 'watch-client', 'watchClient')
  renameProperty(values, 'show-config', 'showConfig')
  /** @type { Webo.Config } */
  const config = { ...baseConfig, command, userEntry, ...overrides, ...values }
  config.serverRoots = config.serverRoots.map(o => path.resolve(o))
  config.clientRoots = config.clientRoots.map(o => path.resolve(o))
  if (values['preset-build']) config.bundle = config.transpile = config.minify = config.cachebust = config.legacy = true
  config.version = version
  return { config, nodeArgs }
}

const baseConfig = {
  command: '',
  userEntry: '',
  serverRoots: [],
  clientRoots: [],
  watchServer: false,
  watchClient: false,
  bundle: false,
  transpile: false,
  minify: false,
  legacy: false,
  cachebust: false,
  output: '',
  verbose: false,
}

const configOverrides = {
  dev: {
    watchServer: true,
    watchClient: true,
  },
  build: {
    output: 'dist/'
  },
  config: {
  },
}


/** @type {() => { values: any, command: Webo.Command, userEntry: string, nodeArgs: string }} */
function getUserOptions() {
  const options = {
    'version': { type: 'boolean', short: 'v' },
    'server-root': { type: 'string', short: 's', multiple: true },
    'client-root': { type: 'string', short: 'c', multiple: true },
    'watch-server': { type: 'boolean' },
    'watch-client': { type: 'boolean' },
    'watch': { type: 'boolean' },
    'bundle': { type: 'boolean' },
    'transpile': { type: 'boolean' },
    'minify': { type: 'boolean' },
    'cachebust': { type: 'boolean' },
    'legacy': { type: 'boolean' },
    'output': { type: 'string' },
    'verbose': { type: 'boolean' },
    'debug': { type: 'boolean' },
    'show-config': { type: 'boolean' },
    'preset-dev': { type: 'boolean' },
    'preset-build': { type: 'boolean' },
  }
  const { values, positionals } =  parseArgs({ options, allowPositionals: true })
  const [ command, userEntry, ...restArgs ] = positionals
  const nodeArgs = restArgs.join(' ').split('--').pop()?.trim() ?? ''
  if (values.version) return logAndExit(`webo v${version}`, 0)
  const validationErrors = validateUserArgs(command, userEntry, options)
  if (validationErrors) return logAndExit(validationErrors, 1)
  if (!command) return logAndExit(`Usage: webo command [entry] [flags]\n  Commands: dev, build, config\n  Flags   : ${Object.keys(options)}`, 1)
  if (command !== 'dev' && command !== 'build' && command !== 'config') return logAndExit(`Unknown command '${command}'\nCommands allowed : dev, build, config`, 1)
  if (command === 'dev' && !userEntry) return logAndExit(`Entry is required for 'dev' command.\nwebo dev [entry]`, 1)
  let missingDeps = ''
  if (values.transpile || values.legacy) {
    missingDeps += checkForMissingDeps('@babel/core', '--transpile or --legacy')
    missingDeps += checkForMissingDeps('@babel/preset-env', '--transpile or --legacy')
    missingDeps += checkForMissingDeps('@babel/polyfill', '--transpile or --legacy')
  }
  if (values.minify) missingDeps += checkForMissingDeps('terser', '--minify')
  if (missingDeps) return logAndExit(missingDeps, 1)
  return { values, command, userEntry, nodeArgs }
}


/** @type {(obj: {[key: string]: any}, oldName: string, newName: string) => void} */
function renameProperty(obj, oldName, newName) {
  if (!Object.hasOwn(obj, oldName)) return
  obj[newName] = obj[oldName]
  delete obj[oldName]
}


/** @type {(errorMessage: string, statusCode: number) => any} */
function logAndExit(errorMessage, statusCode) {
  console.log(errorMessage)
  process.exit(statusCode)
}


/** @type {(command: string, userEntry: string, options: any) => string | undefined} */
function validateUserArgs(command, userEntry, options) {
  if (!command) return `Usage: webo command [entry] [flags]\n  Commands: dev, build, config\n  Flags   : ${Object.keys(options)}`
  if (command !== 'dev' && command !== 'build' && command !== 'config') return `Unknown command '${command}'\nCommands allowed : dev, build, config`
  if (command === 'dev' && !userEntry) return `Entry is required for 'dev' command.\nwebo dev [entry]`
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

async function getVersion() {
  const __dirname = new URL('.', import.meta.url).pathname
  const pkg = await fs.readFile(__dirname + '../package.json', 'utf8')
  const json = JSON.parse(pkg)
  return json.version
}
