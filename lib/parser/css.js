const path = require('path')
const postcss = require('postcss')
const url = require("postcss-url")
const atImport = require("postcss-import")

const { getHash } = require('./hasher')
const utils = require('../utils')




module.exports = async function(content, options) {
  const { mode, root, filename, bundle, hash } = options

  const dirname = path.dirname(filename)
  
  const assets = []
  const result = await postcss()
    .use(atImport({ path: dirname }))
    .use(url({ url: asset => { 
      if (!asset.url.startsWith('http:') && !asset.url.startsWith('https:')) {
        assets.push({ ref: filename, rel: asset.url, type: 'img' })
      }
      return asset.url
    }}))
    .process(content)

  return { content: result.css, assets }
}



function applyHash(el, filename, rel) {
  const depPath = path.relative('.' , path.resolve(path.dirname(filename), rel.split('?')[0])).replace(/\\/g, '/')
  const hash = getHash(depPath)
  if (!hash) return false
  const { state } = require('../state')
  const attr = el['href'] ? 'href' : 'src'
  const parts = el[attr].split('.')
  const dep = state.deps.find(o => o.rel === el[attr])
  if (dep && parts.length > 1) {
    parts[parts.length - 2] = parts[parts.length - 2] + '-' + hash
    el[attr] = parts.join('.')
  }
  return true
}





// module.exports.resolveDeps = async function resolveDeps(filename, options) {
//   const { createDep } = require('../state')
//   const { root } = options
//   // try {
//     // filename = path.resolve(filename)
//     let content = await utils.readFileAsync(filename)
//     const dirname = path.dirname(filename)
//     let urls = []
//     await postcss()
//       .use(atImport({ path: dirname, onImport: async importedFiles => await Promise.all(importedFiles.map(o => resolveDeps(o, options))) }))
//       .use(url({ url: asset => { 
//         if (asset.url.startsWith('http:') || asset.url.startsWith('https:')) return asset
//         // const dep = { uasset.url } //await createDep(filename, asset.url, 'img', root)
//         urls.push(asset.url)
//         // asset.url = dep.relHashed
//     // console.log(filename, asset.url, dep)
//         return asset
//       }}))
//       .process(content)

//     const deps = await Promise.all(
//       urls.map(url => createDep(filename, url, 'img', root))
//     )

//     await postcss()
//       .use(url({ url: asset => { 
//         if (asset.url.startsWith('http:') || asset.url.startsWith('https:')) return asset
//         const dep = deps.find(o => o.rel === asset.url)
//         if (dep) asset.url = dep.relHashed
//         return asset
//       }}))
//       .process(content)

//     // console.log(deps)
//   // console.log(Promise.all(deps))
//     return deps
//   // } catch (error) {
//   //   if (error.code === 'ENOENT') {
//   //     console.error(`${filename} is referenced but not exist`)
//   //   } else {
//   //     console.error(`Error parsing ${filename} - ${error}`)
//   //   }
//   //   return []
//   // }
// }


// module.exports.load = async function load(content, options) {
  
//   const { mode, filename, bundle } = options
//   const { state } = require('../state')

//   if (bundle)   {
//     const dirname = path.dirname(filename)
//     const result = await postcss()
//       .use(atImport({ path: dirname }))
//       .use(url({ url: asset => { 
//         if (asset.url.startsWith('http:') || asset.url.startsWith('https:')) return asset.url
//         const dep = state.deps.find(o => o.rel === asset.url)
//         if (dep) asset.url = dep.relHashed
//         return asset.url
//       }}))
//       .process(content)
//     content = result.css
//   }
  
//   return content

// }
