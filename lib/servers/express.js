const path = require('path')
const { relPath, removeHash, log } = require('../utils/utils.js')
const weboMiddleware = require('./webo/webo-middleware.js')


module.exports = function express(entry) {
  let staticRoots = []
  
  patchExpress(staticRoots),
  require(path.resolve('./' + entry))

  return staticRoots
}


function patchExpress(staticRoots) {
  const expressModule = require(path.resolve('node_modules/express'))
  const serveStatic = require(path.resolve('node_modules/serve-static'))
  let parsing = true

  // monkey patch express-static
  expressModule.static = function static(...args) {
    const staticRoot = relPath(args[0]).replace(/\\/g, '/')
    staticRoots.push(staticRoot)
    return async (req, res, next) => {
      const handled = await weboMiddleware(req, res, staticRoot)
      if (!handled) {
        req.url = removeHash(req.url)
        return serveStatic(staticRoot)(req, res, next)
      }
    }
  }

  // monkey patch express application listen event
  expressModule.application.listen = function listen(...args) {
    if (parsing) return parsing = false
    const expressInstance = require('http').createServer(this)
    if (global.options.port) {
      log(`_YELLOW_express port redirected from ${args[0]} to ${global.options.port}`)
      args[0] = global.options.port
    }
    Object.assign(global.options, { expressInstance })
    expressInstance.listen.apply(expressInstance, args)
  }

}