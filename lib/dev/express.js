const path = require('path')
const { middleware } = require('./server')


module.exports = async (expressEntry, mode) => {

  const [ root, ] = await Promise.all([
    patchExpress(mode),
    require(path.resolve(expressEntry))
  ])
  return root

}

function patchExpress(mode) {
  let root
  return new Promise((resolve, reject) => {
    const expressModule = require(path.resolve('node_modules/express'))
    if (!expressModule) return reject()

    // monkey patch express-static
    expressModule.static = function static(... args) {
      const utils = require('../utils')
      root = utils.resolvePath('.', args[0])
      return middleware
    }
  
     // monkey patch express application listen event
    expressModule.application.listen = function listen(... args) { 
      this.use(require('./server').middleware)
      this._router.stack.unshift(this._router.stack.pop())
      const expressInstance = require('http').createServer(this)
      expressInstance.on('error', error => {
        if (error.code === 'EADDRINUSE') {
          console.log(`Port ${args[0]} is in use. Trying ${args[0] + 1}`)
          args[0] = args[0] + 1
          expressInstance.listen.apply(expressInstance, args)
        } else {
          throw error
        }
      })
      if (mode === 'dev') expressInstance.listen.apply(expressInstance, args)
      resolve(root)
    }
  })
}
