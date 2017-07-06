const path = require('path')

let config = require('./config')
const utils = require('./utils')
const resolve = require('./resolvers/resolve')

const state = {

  mode: null,
  proc: null,

  config,

  entries: [],
  deps: [],

  rootPath: null,
  exclude: null,

}

// module.exports.mode = null
// module.exports.proc = null

// module.exports.config = config
// module.exports.entries = []
// module.exports.deps = []

// module.exports.rootPath = null
// module.exports.exclude = null



async function init(mode, root, options) {
  state.mode = mode
  state.proc = config[mode]

  let userConfig = {}
  try {
    userConfig = require(path.resolve('webo.config.js'))
    merge(config, userConfig)
  } catch (error) { }

  if (root) config.srcRoot = root
  state.rootPath = path.join(path.resolve('.'), config.srcRoot)
  state.exclude = [...config.exclude, config.destRoot + '/**']
  await resolveLayout()

  merge(state, options)
  // if (config.layout) config.layout = path.join(path.resolve(config.srcRoot), config.layout)
  // const ignore = [...config.exclude, config.destRoot + '/**']
  let discoveredEntries = await utils.globAsync('**/*.html', { cwd: '.', nodir: true, ignore: state.exclude })
  // console.log(discoveredEntries)
  // discoveredEntries = discoveredEntries//.map(o => path.resolve(o))//.filter(o => o !== config.layout)
  state.entries.push(... new Set(discoveredEntries))

// console.log('==', userConfig, config.layout)  
  
  await calcDeps()
}


async function updateEntry(filename) {
  if (!state.entries.includes(filename)) {
    state.entries.push(filename)
  }
  const deps = await resolve([ filename ])
  deps.forEach(dep => setDep(dep))
}

async function removeEntry(filename) {
  state.entries.splice(state.entries.indexOf(filename), 1)
  state.deps = state.deps.filter(o => o.root !== filename)
}



function setDep(dep) {
  const index = state.deps.findIndex(o => o.path === dep.path)
  if (index !== -1) {
    state.deps.slice(index, 1, dep)
  } else {
    state.deps.push(dep)
  }
}

async function calcDeps() {
  state.deps.splice()
  const entriesDeps = await resolve(state.entries)
  entriesDeps.forEach(dep => state.deps.push(dep))
}

function merge(dest = {}, src) {
  for (const prop in src) {
    if (!dest[prop] || !dest.hasOwnProperty(prop)) { dest[prop] = src[prop]; continue; }
    if (Array.isArray(dest[prop]) && Array.isArray(src[prop])) { dest[prop].push(... src[prop]); dest[prop] = [... new Set(dest[prop])]; continue; }
    if (typeof dest[prop] === 'object')  { merge(dest[prop], src[prop]); continue; }
    dest[prop] = src[prop]
  }
}

async function resolveLayout() {
  if (state.config.layout) {
    try {
      await utils.readFileAsync(state.config.layout)
    } catch (error) {
      console.error(`layout file not found ${state.config.layout}`)
    }
  } else {
    try {
      await utils.readFileAsync(state.config.srcRoot + '/_layout.html')
      state.config.layout = state.config.srcRoot + '/_layout.html'
      console.log(`using layout file ${state.config.layout}`)
    } catch (error) { }
  }
}


module.exports = {
  state,
  init,
  updateEntry,
  removeEntry,
}