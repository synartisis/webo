const { relPath } = require('./utils')
const htmlFile = require('./filetypes/html')
const jsFile = require('./filetypes/js')
const file = require('./filetypes/file')

const files = []
const bundleRoots = []


function dependants(path) {
  path = relPath(path)
  return files.filter(o => o.path === path || o.deps.some(d => d.path === path))
}

function htmlDependants(path, all = []) {
  dependants(path).filter(o => o.path !== path).forEach(d => {
    // console.log('=====', d.path)
    if (d.ext === 'html') 
      all.push(d)
    else
      htmlDependants(d.path, all)
  })
  return all
}

function attach(path) {
  path = relPath(path)
  let file = files.find(o => o.path === path)
  if (!file) {
    file = createFile(path)
    files.push(file)
  }
  return file
}

function getFile(path) {
  return files.find(o => o.path === relPath(path))
}

function getFileContent(path) {
  path = relPath(path)
  path = path.split('?')[0]
  const pathsToTry = [ path, path + (path.endsWith('/') ? '' : '/') + 'index.html' ]
  // console.log('*',path,pathsToTry)
  let file = files.find(o => pathsToTry.includes(o.path))
  if (!file) file = files.find(o => o.path === path)
  return file && file.content
}

function createFile(path) {
  const ext = path.split('.').pop()
  const options = { path, ext }
  if (ext === 'html') return Object.assign({}, htmlFile, options)
  if (ext === 'js') return Object.assign({}, jsFile, options)
  return Object.assign({}, file, options)
}


module.exports = {
  files,
  bundleRoots,
  attach,
  getFile,
  dependants,
  htmlDependants,
  getFileContent,
}