const path = require('path')
const COLORS = { GREEN: '\x1b[32m', RED: '\x1b[31m', YELLOW: '\x1b[33m', DIM: '\x1b[2m', RESET: '\x1b[0m' }
const config = require('./config')

const context = normalizePath(path.resolve('.'))

function normalizePath(sourcePath) { return path.resolve(sourcePath).replace(/\\/g, '/') }

function relPath(sourcePath) { 
  return normalizePath(sourcePath).replace(context + '/', '')
}

function log(... args) {
  if (args.includes('VERBOSE') && !config.cliFlags.includes('verbose')) return
  console.log([... 
    args.filter(o => !['VERBOSE'].includes(o))
      .map(o => !o || typeof o !== 'object' ? o : JSON.stringify(o, null, 2))
      .map(o => o === 'TIMESTAMP' ? new Date().toISOString().split('T')[1].substring(3, 12) : o)
      .map(o => COLORS[o] || o + ' ')
    , COLORS.RESET
  ].join('').trim())
}

module.exports = {
  context,
  normalizePath,
  relPath,
  log,
}