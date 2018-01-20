const path = require('path')
const { globAsync, readFileAsync, log, logv, calcHash, removeHash } = require('../utils/utils.js')
const { extensions, parse } = require('./parser/parse.js')
const { attachWatchers } = require('./watchers.js')

const NO_CONTENT = '_NO_CONTENT_'

let files = module.exports.files = []
let deps = module.exports.deps = []
let config = {
  mode: null,
  srcRoot: null,
  parserOptions: null,
}
let webSockets = null


const fileBase = require('./parser/file.js')


module.exports.init = async function init(mode, srcRoot, staticRoots, parserOptions) {
  Object.assign(config, { mode, srcRoot, parserOptions })
  const entries = await globAsync(path.posix.join(srcRoot, `**/*.html`), { cwd: '.', nodir: true, ignore: ['**/_*\.html'] })


  fileBase.init(Object.assign({ getHash }, config), attachFile)
  await Promise.all(entries.map(async filename => {
    const file = await attachFile(filename)
    await file.load()
  }))
  
  // await Promise.all(entries.map(filename => attachFile(filename)))

  // await Promise.all(files.map(file => file.load()))
  // await Promise.all(entries.map(loadFile))
  const htmlDeps = files.map(file => file.deps)
    .reduce((flatArr, o) => { flatArr.push(...o); return flatArr }, [])
    .filter(o => extensions.includes(o.filename.split('.').pop()))
  // console.log(htmlDeps)
  const uniqueDeps = htmlDeps.filter((o, idx, arr) => arr.findIndex(f => f.filename === o.filename) === idx)
  // console.log(uniqueDeps)
  await Promise.all(uniqueDeps.map(async dep => {
    const file = await attachFile(dep.filename, dep.type)
    await file.load()
    updateDeps(file.filename, file.deps)
  }))
  // console.log(files)
  // await Promise.all(uniqueDeps.map(loadFile))
  await loadExtras(staticRoots)
}


function attachFile(filename, type, props) {
  // console.log('***', filename, type)
  let file = getFile(filename)
  if (!file) {
    file = fileBase.createFile(filename, type)
    Object.assign(file, props)
    files.push(file)
  } 
  return file
}




module.exports.enableWatching = function enableWatching() {
  attachWatchers(config.srcRoot, touchFile)
  webSockets = require('../servers/webo/wsServer').sockets
}


module.exports.getFileContent = async function getFileContent(filename) {
  // console.log('***',filename , removeHash(filename))
  if (config.parserOptions.hash) filename = removeHash(filename)
  // if (config.parserOptions.hash && ['css', 'js'].includes(filename.split('.').pop())) {
    // if (files[filename] && files[filename].content) {
      // const hash = calcHash(filename, files[filename] && files[filename].content)
      // const ending = "." + filename.split('.').pop()
      // filename = filename.substring(0, filename.length - 6 - ending.length - 1) + ending
    // }
  // }
  // const file = Object.keys(files).map(filename => files[filename]).find(o => o.url === filename)
  // if (file && file.hash) {
  //   filename = filename.replace('-' + file.hash, '')
  //     console.log('**', filename)
  //   }



  // if (!file || file.content === NO_CONTENT) return null




  // if (!files[filename] || files[filename].content === NO_CONTENT) return null
  // return files[filename].content
  const file = files.find(o => o.filename === filename)
  return file && file.getContent()
}

function getFile(filename) {
  return files.find(o => o.filename === filename)
}


async function touchFile(event, filename) {
  const file = getFile(filename)
  if (event === 'unlink') return files.splice(files.indexOf(file), 1) 
  // console.log(file.deps)
  // console.log(file.referrer.filename)
  file.content = null
  await file.load()
  await file.referrer.load()
  // if (file.referrer) file.referrer.content = file.referrer.content.replace(oldHash, file.hash)
  // if (file && await file.getContent() !== NO_CONTENT) {
  //   // const ext = filename.split('.').pop()
  //   // if (extensions.includes(ext)) {
  //   //   await loadFile(filename)
  //   // }
  // }
  // const referrers = config.parserOptions.hash ? getReferrers(filename) : getReferrersOfSameType(filename)
  // await Promise.all(referrers.map(loadFile))
  logv('_CYAN_' + event, filename)
  // logv('_CYAN_' + event, filename + (referrers.length ? ' => ' + referrers.join(', ') : ''))
  notifyClients(file.filename)
}


async function loadFile(filename) {
  const type = getDepType(filename)
  try {
    const { content, deps } = await parse(filename, Object.assign({ type, getHash }, config))
    files[filename] = Object.assign(files[filename] || {}, { content, deps, hash: null })
    updateDeps(filename, deps)
    deps.filter(dep => !(dep.filename in files)).forEach(async dep => files[dep.filename] = { content: NO_CONTENT, deps: [] })
    if (config.parserOptions.hash) {
      await updateHashes([ filename, ...deps.map(o => o.filename) ])
      const ext = filename.split('.').pop()
      if (['html', 'css'].includes(ext)) files[filename].content = (await parse(filename, Object.assign({ type, getHash }, config))).content
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      log(`_RED_not found ${filename} referenced by ${getReferrers(filename).join(', ')}`)
    } else {
      throw error
    }
  }
}


function updateDeps(referrer, dependencies) {
  const depsOf = deps.filter(o => o.ref === referrer)
  dependencies.forEach(dep => {
    const found = depsOf.find(o => o.ref === referrer && o.dep === dep.filename && o.type === dep.type)
    if (!found) deps.push({ ref: referrer, dep: dep.filename, type: dep.type })
  })
  depsOf.forEach(depOf => {
    if (!dependencies.find(o => o.filename === depOf.dep && o.type === depOf.type)) {
      deps.splice(deps.indexOf(depOf), 1)
    }
  })
}

async function updateHashes(filenames) {
  return Promise.all(
    filenames.map(async filename => {
      const hash = await calcHash(filename, files[filename] && files[filename].content)
      Object.assign(files[filename], { hash })
    })
  )
}


function getDepType(filename) {
  const found = deps.find(o => o.dep === filename)
  return found && found.type
}


function getReferrers(filename) {
  return deps.filter(o => o.dep === filename).map(o => o.ref)
}


function getReferrersOfSameType(filename) {
  const ext = filename.split('.').pop()
  return getReferrers(filename).filter(o => o.endsWith('.' + ext))
}


function getHash(filename) {
  return files[filename] && files[filename].hash
}
module.exports.getHash = getHash

function notifyClients(path) {
  const ext = path.split('.').pop()
  ;[... webSockets].filter(o => o.readyState === 1).forEach(socket => socket.send(ext === 'css' ? path : 'refresh'))
}


async function loadExtras(staticRoots) {
  if (!staticRoots.length) return
  const staticRoot = staticRoots[0]
  if (config.parserOptions.transpile) {
    const babelPolyfillContent = await readFileAsync(require.resolve('babel-polyfill/dist/polyfill.min.js'), 'utf8')
    const weboEnvContent = await readFileAsync(__dirname + '/../servers/webo/webo-env.min.js', 'utf8')
    const babelPolyfill = attachFile(staticRoot + '/assets/webo-polyfill.min.js')
    babelPolyfill.content = [ babelPolyfillContent, weboEnvContent ].join('\n\n')
  }
}