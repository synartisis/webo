const babel = require('@babel/core')
const { logParserError, babelPresets } = require('./helpers.js')

module.exports = async function minifier(content, file) {

  try {
    const outContent = (await babel.transform(content, { presets: babelPresets.minify })).code
    return outContent
  } catch (error) {
    logParserError('BABEL TRANSPILE', file, error)
    throw new Error(error)
  }

}