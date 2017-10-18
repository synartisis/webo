const path = require('path')
const { middleware } = require('./server')


module.exports = async (expressEntry, mode) => {

  const [ root, ] = await Promise.all([
    patchExpress(mode),
    require(path.resolve(expressEntry))
  ])
  return root

}

let expressInstance
let listenArgs
function patchExpress(mode) {
  let root
  const expressModule = require(path.resolve('node_modules/express'))
  return new Promise((resolve, reject) => {
    if (!expressModule) return reject()

    // monkey patch express-static
    expressModule.static = function static(... args) {
      const utils = require('../utils')
      root = utils.resolvePath('.', args[0])
      return (req, res, next) => {
        return middleware(req, res, next, ...args)
      }
      // return middleware
    }
  
     // monkey patch express application listen event
    expressModule.application.listen = function listen(... args) { 
      listenArgs = args
      this.use(require('./server').middleware)
      this._router.stack.unshift(this._router.stack.pop())
      expressInstance = require('http').createServer(this)
      require('../state').state.expressInstance = expressInstance
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

module.exports.listen = () => {
  if (expressInstance) {
    expressInstance.listen.apply(expressInstance, listenArgs)
  } else {
    throw new Error('no express instance')
  }
}
