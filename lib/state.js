const path = require('path')
const glob = require('glob')
const { promisify } = require('util')
const globAsync = promisify(glob)

let config = require('./config')
const resolve = require('./resolvers/resolve')

module.exports.mode = null
module.exports.proc = null

module.exports.config = config
module.exports.entries = []
module.exports.deps = new Map


module.exports.init = async function init(mode) {
  module.exports.mode = mode
  module.exports.proc = config[mode]
  
  let userConfig = {}
  try {
    userConfig = require(path.resolve('./webo.config.js'))
    merge(config, userConfig)
  } catch (error) { }

  if (config.layout) config.layout = path.join(path.resolve(config.srcRoot), config.layout)
  const ignore = [...config.exclude, config.destRoot + '/**']
  let discoveredEntries = (await Promise.all(config.include.map(path => globAsync(path, { nodir: true, ignore })))).reduce((flat, o) => { flat.push(...o); return flat }, [])
  discoveredEntries = discoveredEntries.map(o => path.resolve(o))//.filter(o => o !== config.layout)
  module.exports.entries.push(... new Set(discoveredEntries))

  await calcDeps()
}


module.exports.addEntry = async filename => {
  if (!module.exports.entries.includes(filename)) {
    module.exports.entries.push(filename)
  } else {
    const deps = await resolve([ filename ])
    deps.forEach(dep => module.exports.deps.set(dep.path, dep))
  }
}

module.exports.removeEntry = async filename => {
  module.exports.entries.splice(module.exports.entries.indexOf(filename), 1)
  await calcDeps()
}

module.exports.changeEntry = async filename => {
  await calcDeps()
}


async function calcDeps() {
  module.exports.deps.clear()
  const entriesDeps = await resolve(module.exports.entries)
  entriesDeps.forEach(dep => module.exports.deps.set(dep.path, dep))
}



function merge(dest = {}, src) {
  for (const prop in src) {
    if (!dest[prop] || !dest.hasOwnProperty(prop)) { dest[prop] = src[prop]; continue; }
    if (Array.isArray(dest[prop]) && Array.isArray(src[prop])) { dest[prop].push(... src[prop]); continue; }
    if (typeof dest[prop] === 'object')  { merge(dest[prop], src[prop]); continue; }
    dest[prop] = src[prop]
  }
}
