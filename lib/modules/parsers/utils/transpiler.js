const babel = require('@babel/core')
const { logParserError, babelPresets } = require('./helpers.js')

module.exports = async function transpiler(content, file, { preset }) {

  try {
    const options = {}
    if (preset === 'modern') {
      options.presets = babelPresets.transpileModern
    } else {
      options.presets = babelPresets.transpileLegacy
    }
    const { code } = await babel.transform(content, options)
    return code
  } catch (error) {
    logParserError('BABEL TRANSPILE', file, error)
    throw new Error(error)
  }

}