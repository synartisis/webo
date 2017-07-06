const { state } = require('../state')
const { readFileAsync } = require('../utils')
const { promisify } = require('util')

const loaders = require('fs').readdirSync(__dirname).filter(o => o !== 'loader.js' && o.endsWith('.js')).map(o => o.replace('.js', ''))


module.exports = async function load(filename, mode) {
  const ext = filename.split('.').pop()
  if (!loaders.includes(ext)) return 'WEBO_RAW'

  const dep = state.deps.find(o => o.path === filename)
  const { bundle, transpile, minify } = state.proc
  const layout = state.config.layout
  let content = await readFile(filename)
  // if (!content) content = await readFile(filename + '.js')
    // if (!content && ['module', 'script'].includes(dep.type)) content = await readFile(filename + '.js')
  if (content) {
    if (ext === 'html') return require('../loaders/html')(content, { mode, filename, bundle, layout })
    if (ext === 'js') return require('../loaders/js')(content, { mode, filename, type: dep && dep.type || 'script', bundle, transpile, minify })
    if (ext === 'css') return require('../loaders/css')(content, { mode, filename, bundle })
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
