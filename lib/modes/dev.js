const path = require('path')
const bus = require('../modules/bus.js')

module.exports = async function dev({ type, entry, srcRoot, staticRoots, serverRoot, serve, parserOptions }) {

  const webSocketPort = calcUniquePort()
  await bus.memfsInit({ mode: 'dev', srcRoot, staticRoots, serverRoot, serve, parserOptions, watch: true, webSocketPort })

  if (type === 'static') require('../servers/static.js')('dev', srcRoot)

  if (type === 'express') {
    const entryPath = path.resolve('./' + entry)
    delete require.cache[entryPath]
    require(entryPath)
  }

}


function calcUniquePort() {
  // define unique websocket port per project in a deterministic way
  const localPath = require('path').resolve('.')
  return 36000 + localPath.split('').map(o => o.charCodeAt(0)).reduce((sum,o) => sum += o, 0) % 1000
}