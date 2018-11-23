const path = require('path')
const { isDirectory, getMimeType } = require('../../utils/utils.js')
const { getFileContent } = require('../../modules/bus.js')
// const { getFileContent } = require('../../modules/memfs/memfs.js')
const { weboRouter } = require('./webo-router.js')

module.exports = async function weboMiddleware(req, res, root, options) {
  const { extensions } = options

  if (req.url.startsWith('/webo/')) { weboRouter(req, res); return true }
  const fileUrl = req.url.split('?')[0]
  let filename = path.posix.join(root, fileUrl)

  if (await isDirectory(filename)) {
    if (!req.url.endsWith('/') && !req.url.includes('?') && !req.url.includes('#')) { res.setHeader('Location', req.url + '/'); res.statusCode = 302; return res.end() }
    filename += 'index.html'
  }
  
  let content = await getFileContent(filename)
  if (!content) {
    if (extensions) {
      for await (extension of extensions) {
        content = await getFileContent(`${filename}.${extension}`)
        if (content) {
          filename = `${filename}.${extension}`
          break
        }
      }
    }
  }
  
  if (content) {
    res.setHeader('Content-Type', getMimeType(filename))
    res.setHeader('X-Powered-By', 'webo')
    res.end(content)
    return true
  }
  
  return false
}
