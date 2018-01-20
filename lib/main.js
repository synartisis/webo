const started = new Date()

const bus = require('./modules/bus.js')
const { log, logv, COLORS } = require('./utils/utils.js')

module.exports = async function main(mode, entry, options) {

  const version = require('../package.json').version
  global.options = options
  if (options.v) { console.log('version ' + version); process.exit() }

  if (mode === 'init') {
    await require(`./modes/init.js`)(entry)
    process.exit(0)
  }


  log(`${COLORS.GREEN}WEBO ${version} started`)

  bus.init()
  
  const type = await require('./detect/project-type.js')(entry)
  
  if (!type) { console.log(`Unable to detect project type. Your entry must be either a directory or an express.js entry.`); process.exit(1) }
  

  const parserOptions = require('./parser-options.js')(mode, options)
  if (mode === 'dev' && parserOptions.hash) { log(`_RED_Cannot use hash on dev mode.`); process.exit(1) }

  const { srcRoot, staticRoots, serverRoot } = await require('./detect/roots.js')(mode, type, entry)
  Object.assign(options, { entry, serverRoot })
  logv(JSON.stringify({ options, parserOptions }))

  bus.setGlobals(mode, srcRoot, options, parserOptions)
  
  await require(`./modes/${mode}.js`)({ type, entry, srcRoot, staticRoots, serverRoot, parserOptions })
  
  
  log(`${COLORS.GREEN}WEBO ${ mode === 'dev' ? 'loaded' : mode + ' completed' } at`, (new Date().getTime() - started.getTime()) / 1000 + 's')
  if (mode !== 'dev') process.exit(0)

}


process.on('unhandledRejection', (r, p) => p.catch(o => { log('_RED_', o.stack); process.exit(1) }))
