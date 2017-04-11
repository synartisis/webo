const glob = require('glob')
const watcher = require('../watchers/clientWatcher')
const { normalizePath, relPath } = require('../utils')
const files = require('./files')

let config = require('../config')
const roots = []


async function loadDirectory(root) {
  root = normalizePath(root)
  const paths = glob.sync(root + '/**/*', { nodir: true })
  const added = addRoot(relPath(root))
  if (added) {
    const htmlPaths = paths.filter(o => o.endsWith('.html'))// && relPath(o) !== config.layout)
    const htmlFiles = await Promise.all(htmlPaths.map(path => files.attach(path).load()))

    watcher.watchDirectory(root, files, config)
  }
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


module.exports = {
  files: files.files,
  roots,
  loadDirectory,
  getFileContent: files.getFileContent,
  isDirectory: files.isDirectory,
}