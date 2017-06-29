const postcss = require('postcss')
const url = require("postcss-url")
const atImport = require("postcss-import")

const { relPath } = require('../../utils')


module.exports = async function(options) {

  const dirname = require('path').dirname(this.path)
  const result = await postcss()
    .use(atImport({ path: dirname, onImport: importedFiles => importedFiles.forEach(o => this.deps.push({ path: relPath(o) })) }))
    .use(url({ url: asset => { if (!asset.url.startsWith('http')) this.deps.push({ url: asset.relativePath, path: relPath(dirname + '/' + asset.relativePath) }); return asset.url } }))
    .process(this.source)
  this.content = result.css

}