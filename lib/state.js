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
module.exports.deps = []

module.exports.rootPath = null
module.exports.exclude = null



module.exports.init = async function init(mode) {
  module.exports.mode = mode
  module.exports.proc = config[mode]
  
  let userConfig = {}
  try {
    userConfig = require(path.resolve('./webo.config.js'))
    merge(config, userConfig)
  } catch (error) { }

  module.exports.rootPath = path.join(path.resolve('.'), config.srcRoot)
  module.exports.exclude = [...config.exclude, config.destRoot + '/**']
  if (config.layout) config.layout = path.join(path.resolve(config.srcRoot), config.layout)
  // const ignore = [...config.exclude, config.destRoot + '/**']
  let discoveredEntries = (await Promise.all([module.exports.rootPath + '/**/*.html'].map(path => globAsync(path, { nodir: true, ignore: module.exports.exclude })))).reduce((flat, o) => { flat.push(...o); return flat }, [])
  discoveredEntries = discoveredEntries.map(o => path.resolve(o))//.filter(o => o !== config.layout)
  module.exports.entries.push(... new Set(discoveredEntries))

  await calcDeps()
}


const setEntry = module.exports.updateEntry = async filename => {
  if (!module.exports.entries.includes(filename)) {
    module.exports.entries.push(filename)
  }
  const deps = await resolve([ filename ])
  deps.forEach(dep => setDep(dep))
}

// module.exports.addEntry = async filename => {
//   if (!module.exports.entries.includes(filename)) {
//     module.exports.entries.push(filename)
//   } else {
//     const deps = await resolve([ filename ])
//     deps.forEach(dep => setDep(dep))
//   }
// }

module.exports.removeEntry = async filename => {
  module.exports.entries.splice(module.exports.entries.indexOf(filename), 1)
  module.exports.deps = module.exports.deps.filter(o => o.root !== filename)
}

// module.exports.changeEntry = async filename => {
//   await calcDeps()
// }


function setDep(dep) {
  const index = module.exports.deps.findIndex(o => o.path === dep.path)
  if (index !== -1) {
    module.exports.deps.slice(index, 1, dep)
  } else {
    module.exports.deps.push(dep)
  }
}

async function calcDeps() {
  module.exports.deps.splice()
  const entriesDeps = await resolve(module.exports.entries)
  entriesDeps.forEach(dep => module.exports.deps.push(dep))
}



function merge(dest = {}, src) {
  for (const prop in src) {
    if (!dest[prop] || !dest.hasOwnProperty(prop)) { dest[prop] = src[prop]; continue; }
    if (Array.isArray(dest[prop]) && Array.isArray(src[prop])) { dest[prop].push(... src[prop]); dest[prop] = [... new Set(dest[prop])]; continue; }
    if (typeof dest[prop] === 'object')  { merge(dest[prop], src[prop]); continue; }
    dest[prop] = src[prop]
  }
}
