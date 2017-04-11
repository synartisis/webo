const path = require('path')
const COLORS = { GREEN: '\x1b[32m', RED: '\x1b[31m', YELLOW: '\x1b[33m', DIM: '\x1b[2m', RESET: '\x1b[0m' }

const context = normalizePath(path.resolve('.'))

function normalizePath(sourcePath) { return path.resolve(sourcePath).replace(/\\/g, '/') }

function relPath(sourcePath) { 
  return normalizePath(sourcePath).replace(context + '/', '')
}

function log(... args) {
  console.log(... args.map(o => COLORS[o] || o), COLORS.RESET)
}

module.exports = {
  context,
  normalizePath,
  relPath,
  log,
}