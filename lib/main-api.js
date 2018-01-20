const path = require('path')

async function restartServer() {
  global.options.expressInstance.close()
  Object.keys(require.cache).filter(o => !o.includes(path.sep + 'node_modules' + path.sep) && !o.includes(path.sep + 'webo' + path.sep)).forEach(o => delete require.cache[o])
  // console.log(Object.keys(require.cache).filter(o => !o.includes(path.sep + 'node_modules' + path.sep) && !o.includes(path.sep + 'webo' + path.sep)))
  require(path.resolve(global.options.entry))
}


module.exports = {

  restartServer,
  
}