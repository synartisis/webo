
const parsers = {
  html: require('./html'),
  css: require('./css'),
  js: require('./js'),
}



module.exports = async function parse(filename, mode) {
  const { state } = require('../state')
  const ext = filename.split('.').pop()
  if (!parsers[ext]) return { content: null, deps: [] }
  let content = await readFile(filename)
  let deps = []
  if (content !== null) {
    let result = await parsers[ext](content, { mode, filename, layout: state.config.layout, hash: state.proc.hash })
    deps = await Promise.all(result.assets.map(asset => createDep(filename, asset.rel, asset.type, filename))) // TODO root is not correct
    content = result.content
  }

// console.log(filename, result.assets)


  // if (filename === 'src/client/resources/index.html') {
  //   console.log(filename, result.assets)
  //   console.log(deps)
  // }
  // if (recursive) {
  //   await Promise.all(
  //     deps.map(async dep => {
  //       const parseResult = await parse(dep.path, mode, recursive)
  //       if (!deps.find(o => o.path === dep.path && o.rel === dep.rel)) deps.push(...parseResult.deps)
  //     })
  //   )
  // }
// console.log('***', filename, deps.length)
  return { content, deps }
}




async function createDep(referrer, rel, type, root) {
const path = require('path')
const { state } = require('../state')
const utils = require('../utils')
  if (rel.startsWith('http://') || rel.startsWith('https://')) return null
  let depPath
  if (rel.startsWith('/')) {
    depPath = state.config.srcRoot + rel
  } else {
    depPath = path.relative('.' , path.resolve(path.dirname(referrer), rel.split('?')[0])).replace(/\\/g, '/')
  }
// if (rel.endsWith('.css')) console.log(referrer, rel, depPath)
  if (state.proc.hash) { const depRef = state.deps.find(o => o.pathHashed === depPath); if (depRef) depPath = depRef.path }
  let dep = {
    path: depPath,
    get pathHashed() {
      if (!this.hash) return this.rel
      const parts = this.path.split('.')
      if (parts.length > 1) {
        parts[parts.length - 2] += '-' + this.hash
        return parts.join('.')
      }
    },
    ref: referrer,
    rel,
    get relHashed() {
      if (!this.hash) return this.rel
      const relParts = this.rel.split('.')
      if (relParts.length > 1) {
        relParts[relParts.length - 2] += '-' + this.hash
        // dep.rel = relParts.join('.')
        return relParts.join('.')
      }
    },
    type,
    root,
  }
  // console.log(depPath, rel)
  // console.log(depPath)
  // if (state.proc.hash && !dep.hash) dep.hash = await utils.calcHash(depPath)
  return dep
}











async function readFile(filename) {
  const { readFileAsync } = require('../utils')
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
