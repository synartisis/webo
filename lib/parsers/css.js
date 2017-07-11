const path = require('path')
const postcss = require('postcss')
const url = require("postcss-url")
const atImport = require("postcss-import")

const utils = require('../utils')

module.exports.resolveDeps = async function resolveDeps(filename, options) {
  const { createDep } = require('../state')
  const { root } = options
  // try {
    // filename = path.resolve(filename)
    let content = await utils.readFileAsync(filename)
    const dirname = path.dirname(filename)
    let urls = []
    await postcss()
      .use(atImport({ path: dirname, onImport: async importedFiles => await Promise.all(importedFiles.map(o => resolveDeps(o, options))) }))
      .use(url({ url: asset => { 
        if (asset.url.startsWith('http:') || asset.url.startsWith('https:')) return asset
        // const dep = { uasset.url } //await createDep(filename, asset.url, 'img', root)
        urls.push(asset.url)
        // asset.url = dep.relHashed
    // console.log(filename, asset.url, dep)
        return asset
      }}))
      .process(content)

    const deps = await Promise.all(
      urls.map(url => createDep(filename, url, 'img', root))
    )

    await postcss()
      .use(url({ url: asset => { 
        if (asset.url.startsWith('http:') || asset.url.startsWith('https:')) return asset
        const dep = deps.find(o => o.rel === asset.url)
        if (dep) asset.url = dep.relHashed
        return asset
      }}))
      .process(content)

    // console.log(deps)
  // console.log(Promise.all(deps))
    return deps
  // } catch (error) {
  //   if (error.code === 'ENOENT') {
  //     console.error(`${filename} is referenced but not exist`)
  //   } else {
  //     console.error(`Error parsing ${filename} - ${error}`)
  //   }
  //   return []
  // }
}


module.exports.load = async function load(content, options) {
  
  const { mode, filename, bundle } = options
  const { state } = require('../state')

  if (bundle)   {
    const dirname = path.dirname(filename)
    const result = await postcss()
      .use(atImport({ path: dirname }))
      .use(url({ url: asset => { 
        if (asset.url.startsWith('http:') || asset.url.startsWith('https:')) return asset.url
        const dep = state.deps.find(o => o.rel === asset.url)
        if (dep) asset.url = dep.relHashed
        return asset.url
      }}))
      .process(content)
    content = result.css
  }
  
  return content

}
