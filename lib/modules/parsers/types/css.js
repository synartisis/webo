const path = require('path')
const postcss = require('postcss')
const postcssUrl = require("postcss-url")
const postcssImport = require("postcss-import")
const { readFileAsync, calcAssetPath, logv, logParserError, relPath } = require('../utils/helpers.js')

module.exports = async function css(file) {

  const { bundle } = global.parserOptions

  let content = (await readFileAsync(file.filename)).toString()
  const deps = []
  const cssImports = []

  const dirname = path.dirname(file.filename)
  try {
    let processor = postcss()
    const postcssImportConfig = { path: dirname }
    if (!bundle) {
      Object.assign(postcssImportConfig, {
        resolve(id, basedir, importOptions) { cssImports.push(id); return id },
        load(filename, importOptions) { return '' }
      })
    }
    processor = processor.use( postcssImport(postcssImportConfig) )
    processor = processor.use( postcssUrl({
      url({ url }) {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          const assetPath = calcAssetPath(file.filename, url)
          const dep = { filename: assetPath, type: 'raw', ref: url }
          deps.push(dep)
        }
        return url
      }
    }) )

    let { css, messages } = await processor.process(content, { from: file.filename, to: file.filename })
    content = css
    if (cssImports.length) content = cssImports.map(o => `@import url('${o}');`).join('\n') + content
    deps.push(
      ...messages
      .filter(o => o.type === 'dependency' && !o.file.includes('node_modules'))
      .map(o => Object.assign({}, { filename: relPath(o.file), type: 'dep' }))
    )
  } catch (error) {
    logParserError('POSTCSS', file, error)
  }
  // console.log('**', file.filename, deps)

  return Object.assign(file, { content, deps })

}
