const path = require('path')
const COLORS = { GREEN: '\x1b[32m', RED: '\x1b[31m', YELLOW: '\x1b[33m', DIM: '\x1b[2m', RESET: '\x1b[0m' }
const config = require('./config')

function normalizePath(sourcePath) { return path.resolve(sourcePath).replace(/\\/g, '/') }

const context = module.exports.context = normalizePath(path.resolve('.'))

module.exports.normalizePath = normalizePath

module.exports.relPath = sourcePath => normalizePath(sourcePath).replace(context + '/', '')

module.exports.log = (... args) => {
  if (args.includes('VERBOSE') && !config.cliFlags.includes('verbose')) return
  console.log([... 
    args
      .map(o => !o || typeof o !== 'object' ? o : JSON.stringify(o, null, 2))
      .map(o => o === 'VERBOSE' ? COLORS.YELLOW + new Date().toISOString().split('T')[1].substring(3, 12) + COLORS.RESET : o)
      .map(o => o === 'TIMESTAMP' ? new Date().toISOString().split('T')[1].substring(3, 12) : o)
      .map(o => COLORS[o] || o + ' ')
    , COLORS.RESET
  ].join('').trim())
}

module.exports.async = fn => (... args) => new Promise((resolve, reject) => fn(... args, (err, result) => err ? reject(err) : resolve(result) ) )

module.exports.delay = ms => new Promise(resolve => setTimeout(() => resolve(), ms))

module.exports.waitUntil = (predicate, pollingInterval = 100) => new Promise(resolve => {
  const int = setInterval(() => { if (predicate()) { resolve(); clearInterval(int) } }, pollingInterval)
})