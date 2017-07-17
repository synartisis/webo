const path = require('path')
const { middleware } = require('./server')


module.exports = async (expressEntry, mode) => {

  const [ root, ] = await Promise.all([
    patchExpress(),
    require(path.resolve(expressEntry))
  ])
  return root

}

function patchExpress() {
  let root
  return new Promise((resolve, reject) => {
    const expressModule = require(path.resolve('node_modules/express'))
    if (!expressModule) return reject()
    // monkey patch express-static

    expressModule.static = function static(... args) {
      const utils = require('../utils')
      root = utils.resolvePath('.', args[0])
      // state.config.srcRoot = utils.resolvePath('.', args[0])
      // console.log(`using srcRoot ${state.config.srcRoot}`)
      return middleware//.apply(expressModule, args)
      // return weboStatic.apply(expressModule, args)
    }
  
     // monkey patch express application listen event
    expressModule.application.listen = function listen(... args) { 
      this.use(require('./server').middleware)
      this._router.stack.unshift(this._router.stack.pop())
      const expressInstance = require('http').createServer(this)
      expressInstance.listen.apply(expressInstance, args)
      resolve(root)
    }
  })
}
