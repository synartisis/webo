const { readFileAsync } = require('../utils')


module.exports.html = require('./html')
module.exports.css = require('./css')
module.exports.js = require('./js')


module.exports.load = async function load(filename, mode) {
  const { state } = require('../state')
  const ext = filename.split('.').pop()
  if (!['html', 'css', 'js'].includes(ext)) return 'WEBO_RAW'

  const dep = state.deps.find(o => o.path === filename)
  const { bundle, transpile, minify } = state.proc
  const layout = state.config.layout
  let content = await readFile(filename)
  if (content) {
    if (ext === 'html') return await require('./html').load(content, { mode, filename, bundle, layout })
    if (ext === 'js') return await require('./js').load(content, { mode, filename, type: dep && dep.type || 'script', bundle, transpile, minify })
    if (ext === 'css') return await require('./css').load(content, { mode, filename, bundle })
  }
  return content
}


async function readFile(filename) {
  const ext = filename.split('.').pop()
  const mimeType = require('mime').types[ext]
  const isText = mimeType.split('/')[0] === 'text' || mimeType === 'application/javascript'//  !!mimeType && ['text', 'application'].includes(mimeType.split('/')[0])
  try {
    return await readFileAsync(filename, isText ? 'utf8' : null)
  } catch (error) {
    if (error.code !== 'ENOENT') console.error(error)
    return null
  }
}
