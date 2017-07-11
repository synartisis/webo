const path = require('path')

let config = require('./config')
const utils = require('./utils')
const parsers = require('./parsers')

const state = {

  mode: null,
  proc: null,

  config,

  entries: [],
  deps: [],

  rootPath: null,
  exclude: null,

}




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
  let discoveredEntries = await utils.globAsync('**/*.html', { cwd: '.', nodir: true, ignore: state.exclude })
  // console.log(discoveredEntries)
  state.entries.push(... new Set(discoveredEntries))

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


function createDep(referrer, rel, type, root) {
  // const { state } = require('../state')
  if (rel.startsWith('http://') || rel.startsWith('https://')) return null
  let depPath
  if (rel.startsWith('/')) {
    depPath = state.config.srcRoot + rel
  } else {
    depPath = path.relative('.' , path.resolve(path.dirname(referrer), rel.split('?')[0])).replace(/\\/g, '/')
  }
  let dep = {
    path: depPath,
    ref: referrer,
    rel,
    get relHashed() {
      if (!this.hash) return this.rel
      const relParts = this.rel.split('.')
      if (relParts.length > 1) {
        relParts[relParts.length - 2] += '-' + this.hash
        // dep.rel = relParts.join('.')
        return relParts.join('.')
      }
    },
    type,
    root,
  }
  // if (state.proc.hash) {
  //   const relParts = dep.rel.split('.')
  //   if (relParts.length > 1) {
  //     relParts[relParts.length - 2] += '-' + (await utils.calcHash(depPath))
  //     // dep.rel = relParts.join('.')
  //     dep.relHashed = relParts.join('.')
  //   }
  // }
  return dep
}


function setDep(dep) {
  const index = state.deps.findIndex(o => o.ref === dep.ref && o.path === dep.path)
  if (index !== -1) {
    state.deps.slice(index, 1, dep)
  } else {
    state.deps.push(dep)
  }
}




async function calcDeps() {
  await Promise.all(
    state.entries.map(async entry => {
      state.deps.push(... await parsers.resolveDeps(entry))
      // const content = await utils.readFileAsync(entry)
      // state.deps.push(... await parsers.html.resolveDeps(content, { filename: entry, layout: state.config.layout, hash: state.proc.hash }))
    })
  )
  // console.log(state.entries)
  // console.log(state.deps)
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
  let layoutPath = state.config.layout || (await utils.globAsync('**/_layout.html', { cwd: '.', nodir: true, ignore: state.exclude }))[0]
  if (!layoutPath) return
  try {
    await utils.readFileAsync(layoutPath)
    state.config.layout = layoutPath
    console.log(`using layout file ${state.config.layout}`)
  } catch (error) {
    if (layoutPath) console.error(`layout file not found ${layoutPath}`)
    if (state.config.layout) process.exit()
  }



  // if (state.config.layout) {
  //   try {
  //     await utils.readFileAsync(state.config.layout)
  //   } catch (error) {
  //     console.error(`layout file not found ${state.config.layout}`)
  //   }
  // } else {
  //   try {
  //     await utils.readFileAsync(state.config.srcRoot + '/_layout.html')
  //     state.config.layout = state.config.srcRoot + '/_layout.html'
  //     console.log(`using layout file ${state.config.layout}`)
  //   } catch (error) { }
  // }
}


module.exports = {
  state,
  init,
  updateEntry,
  removeEntry,
  setDep,
  createDep,
}
