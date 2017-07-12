const { readFileAsync } = require('../utils')

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
  const result = await parsers[ext](content, { mode, filename, layout: state.config.layout, hash: state.proc.hash })
  content = result.content
  const deps = await Promise.all(result.assets.map(asset => createDep(filename, asset.rel, asset.type, filename))) // TODO root is not correct
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











// module.exports.html = require('./html')
// module.exports.css = require('./css')
// module.exports.js = require('./js')


// module.exports.load = async function load(filename, mode) {
//   // console.log('0', filename)  
//   const { state } = require('../state')
//   const ext = filename.split('.').pop()
//   const { bundle, transpile, minify, hash } = state.proc
//   // const parts = filename.split('.')
//   // if (!filename.endsWith('.html') && parts.length > 1) {
//   // // console.log('1', filename)  
//   //   parts[parts.length - 2] = parts[parts.length - 2].split('-')[0]
//   //   filename = parts.join('.')
//   // // console.log('2', filename)  

//   // }
//   if (!filename.endsWith('.html') && hash) {
//     const dep = state.deps.find(o => o.pathHashed === filename)
//     if (dep) filename = dep.path
//   }

//   if (!['html', 'css', 'js'].includes(ext)) return 'WEBO_RAW:' + filename

//   const dep = state.deps.find(o => o.path === filename)
//   const layout = state.config.layout
//   let content = await readFile(filename)
//   if (content) {
//     if (ext === 'html') return await require('./html').load(content, { mode, filename, bundle, hash, layout })
//     if (ext === 'js') return await require('./js').load(content, { mode, filename, type: dep && dep.type || 'script', bundle, transpile, minify })
//     if (ext === 'css') return await require('./css').load(content, { mode, filename, bundle })
//   }
//   return content
// }



// module.exports.resolveDeps = async function resolveDeps(filename) {
//   const { state } = require('../state')
//   const ext = filename.split('.').pop()
//   const content = await readFile(filename)
//   if (!parsers[ext]) return { content, assets: [] }
//   const result = await parsers[ext](content, { filename, layout: state.config.layout, hash: state.proc.hash })

//   if (filename === 'src/client/resources/index.html') {
//     console.log(filename, result.assets)
//     // const deps = result.assets.map(asset => {
//     //   return {
//     //     path: filename,
//     //     rel: asset.rel,
//     //     type: asset.type,
//     //   }
//     // })
//     const deps = await Promise.all(result.assets.map(asset => createDep(filename, asset.rel, asset.type, filename))) // TODO root is not correct
//     console.log(deps)
//   }

//   return []


//   // return parsers[ext] ? parsers[ext].resolveDeps(content, { filename, layout: state.config.layout, hash: state.proc.hash }) : []





//   // const { state } = require('../state')
//   // const ext = filename.split('.').pop()
//   // const content = await readFile(filename)
//   // return parsers[ext] ? parsers[ext].resolveDeps(content, { filename, layout: state.config.layout, hash: state.proc.hash }) : []
// }





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
if (rel.endsWith('.css')) console.log(referrer, rel, depPath)
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
  // console.log(depPath)
  if (state.proc.hash && !dep.hash) dep.hash = await utils.calcHash(depPath)
  return dep
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
