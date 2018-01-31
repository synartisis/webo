const babel = require('@babel/core')
const { logParserError, babelPresets } = require('./helpers.js')

module.exports = async function minifier(content, file) {

  try {
    const { code: outContent} = await babel.transform(content, { presets: babelPresets.minify })
    return outContent
  } catch (error) {
    logParserError('BABEL MINIFY', file, error)
    return content
  }

}