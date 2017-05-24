const path = require('path')

let defaultConfig = {
  dest: 'dist',
  srcRoot: 'src',
  paths: {},
  globals: {},
  includeServerDirectory: true,
  vendorFilename: null,
  layout: null,
  cliFlags: [],
  exclude: [],
}


let userConfig = {}
try {
  userConfig = require(path.resolve('./webo.config.js'))
} catch (error) { }

merge(defaultConfig, userConfig)


function merge(dest = {}, src) {
  for (const prop in src) {
    if (!dest[prop] || !dest.hasOwnProperty(prop)) { dest[prop] = src[prop]; continue; }
    if (Array.isArray(dest[prop]) && Array.isArray(src[prop])) { dest[prop].push(... src[prop]); continue; }
    if (typeof dest[prop] === 'object')  { merge(dest[prop], src[prop]); continue; }
    dest[prop] = src[prop]
  }
}


module.exports = defaultConfig