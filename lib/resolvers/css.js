const postcss = require('postcss')
const url = require("postcss-url")
const atImport = require("postcss-import")
const path = require('path')
const fs = require('fs')
const { promisify } = require('util')
const { createDep } = require('./dep')

module.exports = async (filename, root) => {
  try {
    filename = path.resolve(filename)
    const content = await promisify(fs.readFile)(filename, 'utf8')
    const dirname = path.dirname(filename)
    let deps = []
    const result = await postcss()
      .use(atImport({ path: dirname, onImport: importedFiles => importedFiles.forEach(o => module.exports(o)) }))
      .use(url({ url: asset => { deps.push(createDep(filename, asset.url, 'img', root)) }}))
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