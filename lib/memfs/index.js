const glob = require('glob')
const fs = require('fs')
const { relPath, normalizePath, log, async, waitUntil } = require('../utils')
const config = require('../config')

const EXTENSIONS = ['html', 'css', 'js']

const files = module.exports.files = []
const roots = module.exports.roots = new Set
const pending = { started: false, roots: new Set, files: new Set }


module.exports.attachDirectory = async path => {
  path = relPath(path)
  const added = addRoot(path)
  if (added) {
    log('VERBOSE', 'ATTACH', path)
    pending.roots.add(path)
    const paths = await async(glob)(path + '/**/*', { nodir: true })
    await Promise.all(paths.map(attachFile))
    pending.roots.delete(path)
  }
  return added
}


const attachFile = module.exports.attachFile = async path => {
  path = relPath(path)
  if (getFile(path)) return null
  const ext = path.split('.').pop()
  const type = ['js'].includes(ext) ? null : 'raw'
  const file = {
    path,
    ext,
    type,
    source: null,
    content: null,
    deps: [],
  }
  files.push(file)
  await loadFileSource(file)
  return file
}


module.exports.unlink = path => {
  path = relPath(path)
  files.splice(files.findIndex(o => o.path === path), 1)
}


const getFile = module.exports.getFile = function getFile(path) {
  path = relPath(path)
  return files.find(o => o.path === path)
}


module.exports.isDirectory = path => {
  path = relPath(path)
  return !files.find(o => o.path === path) && !!files.find(o => o.path.startsWith(path + (path.endsWith('/') ? '' : '/')))
}


module.exports.ready = () => waitUntil(() => pending.started && pending.files.size === 0, 300)


module.exports.loadAll = async () => {
  if (pending.started) return
  await waitUntil(() => !roots.size || pending.roots.size === 0, 300)  // wait for all files to be attached
  await Promise.all(
    files.filter(file => file.ext === 'html').map(file => loadFileContent(file.path))
  )
  await Promise.all(
    files.filter(file => file.ext !== 'html').map(file => loadFileContent(file.path))
  )
}


module.exports.touch = async path => {
  path = relPath(path)
  // console.log('touch', path)
  const file = getFile(path)
  if (!file) return []
  await loadFileSource(file)
  await loadFileContent(path)
  const dependants = findDependants(path)
  await Promise.all(
    dependants.filter(o => o.ext !== 'html').map(dependant => loadFileContent(dependant.path))
  )
  const depsChanged = [file, ...dependants].map(o => htmlDepUrls(o.path)).filter(o => o.length).reduce((flat, o) => flat.push(...o) && flat, [])
  if (path === config.layout) {
    await Promise.all(
      files.filter(o => o.layout === path).map(file => loadFileContent(file.path))
    )
  }
  return depsChanged
}



// setTimeout(async () => {
//   // await loadFile('src/client/landing/index.html')
//   // await loadFile('src/client/landing/index.html')
//   // files.find(o => o.path === 'src/client/landing/index.js').type = 'module'
//   // await loadFile('src/client/landing/index.js')
//   // await loadFile('src/client/landing/index.js')
//   await loadAll()
//   console.log('***DONE***')
// }, 2000)






function addRoot(root) {
  let narrowerRoot = [... roots].find(r => r !== root && r.startsWith(root))
  let widerRoot = [... roots].find(r => r !== root && root.startsWith(r))
  if (narrowerRoot) roots.delete(narrowerRoot)
  if (!roots.has(root) && !widerRoot) {
    roots.add(root)
    return true
  }
  return false
}


async function loadFileSource(file) {
  file.source = EXTENSIONS.includes(file.ext) ? await async(fs.readFile)(file.path, 'utf8') : null
  file.content = null
}


function findDependants(path, all = []) {
  const parents = files.filter(o => o.deps.some(d => d.path === path))
  all.push(... parents)
  parents.forEach(parent => findDependants(parent.path, all))
  return all
}


function htmlDepUrls(path) {
  const depUrls = new Set
  files.filter(o => o.ext === 'html').forEach(html => {
    html.deps.filter(dep => dep.path === path).forEach(dep => depUrls.add(dep.url))
  })
  return [...depUrls]
}


async function loadFileContent(path) {
  if (!pending.started) pending.started = true
  path = relPath(path)
  const file = getFile(path)
  if (file) {
    pending.files.add(path)
    if (file.ext === 'html') await require('./loaders/html').call(file, { layout: config.layout ? files.find(o => o.path === config.layout) : null })
    if (file.ext === 'js') await require('./loaders/js').call(file, { type: file.type || getDepType(file.path), files: flatJsFiles() })
    if (file.ext === 'css') await require('./loaders/css').call(file)
    pending.files.delete(path)
  } else {
    throw `File ${path} is not attached`
  }
  return file
}


function flatJsFiles() {
  return files.filter(o => o.ext === 'js').reduce((flat, f) => { flat[normalizePath(require('path').resolve(f.path))] = f.source; return flat }, {})
}

function getDepType(path) {
  const dep = files.map(file => file.deps).filter(o => !!o.length).reduce((flat, deps) => flat.push(... deps) && flat, []).find(dep => dep.path === path)
  if (dep && dep.type) return dep.type
  const ext = path.split('.').pop()
  if (ext === 'html') return 'html'
  if (ext === 'css') return 'stylesheet'
  if (ext === 'js' && jsRoots().has(path)) return 'script'
  return 'raw'
}

function jsRoots() {
  return new Set(files.filter(o => o.ext === 'html').map(o => o.deps.filter(o => o.path.endsWith('.js'))).filter(o => !!o.length).reduce((flat, deps) => flat.push(... deps) && flat, []).map(o => o.path))
}
