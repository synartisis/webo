// const postcss = require('postcss')
// const url = require("postcss-url")
// const atImport = require("postcss-import")
// const file = require('./file')()
// const { relPath } = require('../../utils')


// module.exports = () => {
//   return Object.assign({}, file, {

//     deps: [],

//     async load() {
//       const source = await this.readFile()
//       const result = await postcss()
//         .use(atImport({ path: this.dirname(), onImport: importedFiles => importedFiles.forEach(o => this.deps.push({ path: relPath(o) })) }))
//         .use(url({ url: asset => { this.deps.push({ url: asset.relativePath, path: relPath(this.dirname() + '/' + asset.relativePath) }); return asset.url } }))
//         .process(source)
//       this.content = result.css
//       return this
//     }

//   })
// }