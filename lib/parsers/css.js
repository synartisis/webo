const path = require('path')
const postcss = require('postcss')
const url = require("postcss-url")
const atImport = require("postcss-import")

const { createDep } = require('./dep')
const utils = require('../utils')

module.exports.resolveDeps = async function resolveDeps(filename, options) {
  const { root } = options
  try {
    // filename = path.resolve(filename)
    const content = await utils.readFileAsync(filename)
    const dirname = path.dirname(filename)
    let deps = []
    await postcss()
      .use(atImport({ path: dirname, onImport: async importedFiles => await Promise.all(importedFiles.map(o => resolveDeps(o, options))) }))
      .use(url({ url: asset => { if (!asset.url.startsWith('http')) deps.push(createDep(filename, asset.url, 'img', root)) }}))
      .process(content)
    return deps
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`${filename} is referenced but not exist`)
    } else {
      console.error(`Error parsing ${filename} - ${error}`)
    }
    return []
  }
}


module.exports.load = async function load(content, options) {
  
  const { mode, filename, bundle } = options

  if (bundle)   {
    const dirname = path.dirname(filename)
    const result = await postcss()
      .use(atImport({ path: dirname }))
      .process(content)
    content = result.content
  }
  
  return content

}
