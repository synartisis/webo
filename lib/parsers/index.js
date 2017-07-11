const { readFileAsync } = require('../utils')

const parsers = {
  html: require('./html'),
  css: require('./css'),
  js: require('./js'),
}
module.exports.html = require('./html')
module.exports.css = require('./css')
module.exports.js = require('./js')


module.exports.load = async function load(filename, mode) {
  // console.log('0', filename)  
  const { state } = require('../state')
  const ext = filename.split('.').pop()
  const { bundle, transpile, minify, hash } = state.proc
  // const parts = filename.split('.')
  // if (!filename.endsWith('.html') && parts.length > 1) {
  // // console.log('1', filename)  
  //   parts[parts.length - 2] = parts[parts.length - 2].split('-')[0]
  //   filename = parts.join('.')
  // // console.log('2', filename)  

  // }
  if (!filename.endsWith('.html') && hash) {
    const dep = state.deps.find(o => o.pathHashed === filename)
    if (dep) filename = dep.path
  }

  if (!['html', 'css', 'js'].includes(ext)) return 'WEBO_RAW:' + filename

  const dep = state.deps.find(o => o.path === filename)
  const layout = state.config.layout
  let content = await readFile(filename)
  if (content) {
    if (ext === 'html') return await require('./html').load(content, { mode, filename, bundle, hash, layout })
    if (ext === 'js') return await require('./js').load(content, { mode, filename, type: dep && dep.type || 'script', bundle, transpile, minify })
    if (ext === 'css') return await require('./css').load(content, { mode, filename, bundle })
  }
  return content
}



module.exports.resolveDeps = async function resolveDeps(filename) {
  const { state } = require('../state')
  const ext = filename.split('.').pop()
  const content = await readFile(filename)
  return parsers[ext] ? parsers[ext].resolveDeps(content, { filename, layout: state.config.layout, hash: state.proc.hash }) : []
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
