const path = require('path')


module.exports = expressEntry => {

  patchExpress()
  require(path.resolve(expressEntry))

}

function patchExpress() {
  const expressModule = require(path.resolve('node_modules/express'))
  if (!expressModule) return

  // monkey patch express-static
  // expressModule.static = function static(... args) {
  //   return weboStatic.apply(expressModule, args)
  // }

   // monkey patch express application listen event
  expressModule.application.listen = function listen(... args) { 
    this.use(require('./server').middleware)
    this._router.stack.unshift(this._router.stack.pop())
    const expressInstance = require('http').createServer(this)
    return expressInstance.listen.apply(expressInstance, args)
  }
}
