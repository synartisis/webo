const http = require('http')

const utils = require('../utils')
const { state } = require('../state')
const loader = require('../loaders/loader')
const weboServer = require('./webo/weboServer')

module.exports = async function server(WS_PORT) {

  http.createServer(async (req, res) => {

    let [ path, query ] = req.url.split('?')
    // let filename = path.substring(1)
    let filename = state.config.srcRoot + path
    let ext = filename.split('.').pop()

    // console.log('***', filename, state.config.srcRoot)
    // filename = utils.resolvePath(state.config.srcRoot, filename)
    // filename = path.join(path.resolve('.'), state.config.srcRoot, filename)
      // console.log(req.method, req.url, filename)

    let isDir = false
    try { isDir = (await utils.lstatAsync(filename)).isDirectory() } catch (error) { }
    if (isDir && !req.url.endsWith('/')) { res.setHeader('Location', req.url + '/'); res.statusCode = 302; return res.end() }
    if (isDir) { filename += 'index.html'; ext = 'html' }

    res.setHeader('Content-Type', require('mime').types[ext] || 'text/html')
    if (!['html', 'css', 'js'].includes(ext)) return require('fs').createReadStream(filename).pipe(res)
    const content = await loader(filename, 'dev')

    if (!content && (req.url.startsWith('/webo/') || req.url === '/')) return weboServer(req, res, WS_PORT)

    if (content === null) res.statusCode = 404
    res.end(content)

  }).listen(state.config.dev.port, () => console.log('listening ' + state.config.dev.port))

}
