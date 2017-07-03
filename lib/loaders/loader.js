const state = require('../state')
const { promisify } = require('util')
const fs = require('fs')
const readFileAsync = promisify(fs.readFile)


module.exports = async function load(filename, mode) {
  let ext = filename.split('.').pop()
  const dep = state.deps.get(filename)
  const { bundle, transpile, minify } = state.proc
  const layout = state.config.layout
  let content = await readFile(filename)
  // if (!content) content = await readFile(filename + '.js')
    // if (!content && ['module', 'script'].includes(dep.type)) content = await readFile(filename + '.js')
  if (content) {
    if (ext === 'html') return require('../loaders/html')(content, { mode, bundle, layout })
    if (ext === 'js') return require('../loaders/js')(content, { mode, filename, type: dep && dep.type || 'script', bundle, transpile, minify })
    if (ext === 'css') return require('../loaders/css')(content, { mode, filename, bundle })
  }
  return content
}


async function readFile(filename) {
  const ext = filename.split('.').pop()
  const mimeType = require('mime').types[ext]
  const isText = !!mimeType && ['text', 'application'].includes(mimeType.split('/')[0])
  try {
    return await readFileAsync(filename, isText ? 'utf8' : null)
  } catch (error) {
    if (error.code !== 'ENOENT') console.error(error)
    return null
  }
}
