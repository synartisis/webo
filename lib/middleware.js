// const { relPath } = require('./filesystem/utils')
// const weboStatic = require('./weboServer/server')

// let config = require('./config')
// let initialized = false


// function initialize(expressServerPath) {
//   console.log(module.parent.children.map(o => o.id), require('path').resolve(expressServerPath))
//   const expressModule = module.parent.children.find(o => o.id.startsWith(require('path').resolve(expressServerPath)))

//   // const expressModule = module.parent.parent.children.find(o => o.id.replace(/\\/g, '/').includes('/node_modules/express/'))
//   expressModule.exports.static = weboStatic // monkey patch express-static
//   const serverPath = require('path').dirname(relPath(expressModule.filename))
//   // const serverPath = require('path').dirname(relPath(module.parent.parent.filename))
//   // if (config.includeServerDirectory && !config.paths[serverPath]) config.paths[serverPath] = serverPath.replace(config.srcRoot + '/', '')
//   if (config.layout) config.layout = relPath(config.layout)
//   // require('./watchers/serverWatcher')()
//   initialized = true
// }


// function merge(dest = {}, src) {
//   for (const prop in src) {
//     if (!dest[prop] || !dest.hasOwnProperty(prop)) { dest[prop] = src[prop]; continue; }
//     if (Array.isArray(dest[prop]) && Array.isArray(src[prop])) { dest[prop].push(... src[prop]); continue; }
//     if (typeof dest[prop] === 'object')  { merge(dest[prop], src[prop]); continue; }
//     dest[prop] = src[prop]
//   }
// }


// function expressConfig(cnf, expressServerPath) {
//   merge(config, cnf)
//   if (!initialized) initialize(expressServerPath)
//   return (req, res, next) => next()
// }


// module.exports = expressConfig
