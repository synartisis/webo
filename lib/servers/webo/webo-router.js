const fs = require('fs')
const { getFiles, getFileContent } = require('../../modules/bus.js')

module.exports.webSocketPort = calcUniquePort()

const WEBO_SOCKET_CLIENT = fs.readFileSync(__dirname + '/webo-socket.js', 'utf8').replace('[WS_PORT]', module.exports.webSocketPort)

module.exports.weboRouter = async function weboRouter(req, res) {
  if (req.url === '/webo/webo-socket.js') {
    res.setHeader('Content-Type', 'application/javascript')
    return res.end(WEBO_SOCKET_CLIENT)
  }
  if (req.url.startsWith('/webo/files')) return routeFiles(req, res)
  if (req.url.startsWith('/webo/file/')) return routeFile(req, res)
}


function calcUniquePort() {
  // define unique websocket port per project in a deterministic way
  const localPath = require('path').resolve('.')
  return 36000 + localPath.split('').map(o => o.charCodeAt(0)).reduce((sum,o) => sum += o, 0) % 1000
}


async function routeFiles(req, res) {
  const { q, t, dep } = req.query || {}
  let files = await getFiles()
  files = files.map(file => Object.assign({}, file, { 
    content: file.content && file.content.substring(0, 50) + '...', 
    deps: file.deps && file.deps.map(o => `${o.filename} - ${o.type}${o.sourceFilename ? ' (' + o.sourceFilename + ')' : ''}`)
  }))
  .filter(file => !t || file.type === t)
  .filter(file => !dep || file.deps && file.deps.some(depName => new RegExp(dep).test(depName)))
  .filter(file => !q || new RegExp(q).test(JSON.stringify(file)))
  res.end(JSON.stringify(files, null, 2) + '\n')
}

async function routeFile(req, res) {
  const filename = req.url.replace('/webo/file/', '')
  const content = await getFileContent(filename)
  res.end(content + '\n')
}
