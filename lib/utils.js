const path = require('path')

const context = normalizePath(path.resolve('.'))

function normalizePath(sourcePath) { return path.resolve(sourcePath).replace(/\\/g, '/') }

function relPath(sourcePath) { 
  return normalizePath(sourcePath).replace(context + '/', '')
}

module.exports = {
  context,
  normalizePath,
  relPath,
}