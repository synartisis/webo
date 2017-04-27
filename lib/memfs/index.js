const glob = require('glob')
const fs = require('fs')
const { relPath, normalizePath, log } = require('../utils')
const config = require('../config')

const EXTENSIONS = ['html', 'css', 'js']
let files = []
const roots = []
const rootsPending = new Set

async function attachDirectory(path) {
  path = relPath(path)
  // log('VERBOSE', 'LOADING', path)
  const added = addRoot(path)
  if (added) {
    rootsPending.add(path)
    const paths = glob.sync(path + '/**/*', { nodir: true })
    await Promise.all(paths.map(attachFile))
    rootsPending.delete(path)
  }
  return added
}

async function ready() {
  return new Promise(resolve => {
    const interval = setInterval(() => {
      if (!roots.length || rootsPending.size === 0) {
        clearInterval(interval)
        resolve()
      }
    }, 300)
  })
}

async function loadAll() {
  await ready()
  await Promise.all(
    files.filter(file => file.ext === 'html').map(file => loadFile(file.path))
  )
  await Promise.all(
    files.filter(file => file.ext !== 'html').map(file => loadFile(file.path))
  )
}

async function loadFile(path) {
  path = relPath(path)
  const file = files.find(o => o.path === path)
  if (!file) throw `File ${path} is not attached`
  if (file.ext === 'html') await require('./loaders/html').call(file, { layout: config.layout ? files.find(o => o.path === config.layout) : null })
  if (file.ext === 'js') await require('./loaders/js').call(file, { type: file.type || getDepType(file.path), files: flatJsFiles() })
  if (file.ext === 'css') await require('./loaders/css').call(file)
  return file
}

async function fileChanged(path, url = null, changedFiles = []) {
  path = relPath(path)
// console.log('filechanged', path)
  const file = files.find(o => o.path === path)
  if (!file) return []
  await loadContent(file)
  await loadFile(path)
  changedFiles.push(url)
  const dependants = findDependants(path)
  await Promise.all(
    dependants.map(async dependant => await fileChanged(dependant.path, dependant.deps.find(dep => dep.path === path).url, changedFiles))
  )
  if (path === config.layout) {
    await Promise.all(
      files.filter(o => o.layout === path).map(file => fileChanged(file.path, file.path, changedFiles))
    )
  }
  return changedFiles.filter(o => !!o)
}

function findDependants(path) {
  return files.filter(o => o.deps.some(d => d.path === path))
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

// setTimeout(async () => {
//   // await loadFile('src/client/landing/index.js')
//   // await loadFile('src/client/landing/index.js')
// }, 10000)


async function attachFile(path) {
  path = relPath(path)
  if (files.find(o => o.path === path)) return null
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
  await loadContent(file)
  return file
}

async function loadContent(file) {
  file.source = EXTENSIONS.includes(file.ext) ? await loadFileContent(file.path) : null
}

async function loadFileContent(path, encoding = 'utf8') {
  return new Promise((resolve, reject) => fs.readFile(path, encoding, (err, data) => err ? reject(err) : resolve(data)))
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

function isDirectory(path) {
  path = relPath(path)
  return !files.find(o => o.path === path) && !!files.find(o => o.path === path + (path.endsWith('/') ? '' : '/') + 'index.html' )
}

function getFileContent(path) {
  path = relPath(path) + (path.endsWith('/') ? '/' : '')
  path = path.split('?')[0]
  const pathsToTry = [ path.endsWith('/') ? path + 'index.html' : path ]
  // console.log('*',path,pathsToTry)
  let file = files.find(o => pathsToTry.includes(o.path))
  if (!file) file = files.find(o => o.path === path)
  return file && file.content
}

function addRoot(root) {
  let narrowerRoot = roots.findIndex(r => r && r.startsWith(root))
  if (narrowerRoot !== -1) roots.splice(narrowerRoot, 1, root)
  if (!roots.find(r => root.startsWith(r))) {
    roots.push(root)
    return true
  }
  return false
}

function unlink(path) {
  path = relPath(path)
  files.splice(files.findIndex(o => o.path === path), 1)
}


module.exports = {
  files,
  roots,
  attachDirectory,
  attachFile,
  fileChanged,
  loadAll,
  getFileContent,
  isDirectory,
  unlink,
  ready,
}