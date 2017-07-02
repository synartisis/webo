const state = require('../state')
const { promisify } = require('util')
const fs = require('fs')
const readFileAsync = promisify(fs.readFile)


module.exports = async function load(filename, mode) {
  let ext = filename.split('.').pop()
  const dep = state.deps.get(filename)
  const bundle = mode === 'dev' ? state.config.dev.bundle : state.config.prod.bundle
  let content = await readFile(filename)
  if (content) {
    if (ext === 'html') return require('../loaders/html')(content, { mode, bundle })
    if (ext === 'js') return require('../loaders/js')(content, { mode, filename, bundle, type: dep && dep.type || 'script' })
    if (ext === 'css') return require('../loaders/css')(content, { mode, filename, bundle })
  }
  return content
}


async function readFile(filename) {
  const ext = filename.split('.').pop()
  const mimeType = require('mime').types[ext]
  const isText = ['text', 'application'].includes(mimeType.split('/')[0])
  try {
    const content = await readFileAsync(filename, isText ? 'utf8' : null)
    return content
  } catch (error) {
    if (error.code !== 'ENOENT') console.error(error)
    return null
  }
}
