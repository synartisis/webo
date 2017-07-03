const rollup = require('rollup')
const babel = require('babel-core')
const babelPresetEnv = require('babel-preset-env')
const babelPresetBabili = require('babel-preset-babili')

module.exports = async (content, options) => {

  const { filename, type, bundle, transpile, minify } = options

  if (bundle && type === 'module') {
    let rollupBundle = await rollup.rollup({ 
      entry: filename, 
    })
    let { code } = rollupBundle.generate({ format: 'iife' })
    content = code
  }

  if (transpile) {
    let presets = [[ babelPresetEnv, { modules: false }]]
    if (minify) presets.push([ babelPresetBabili ])
    const { code, map } = babel.transform(content, { presets })
    content = code
  }

  return content

}