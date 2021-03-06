const babel = require(require.resolve('@babel/core', { paths: [ process.cwd() ] }))
const babelPresets = {
  transpileLegacy: [[ require.resolve('@babel/preset-env', { paths: [ process.cwd() ] }), { modules: false }]],
  transpileModern: [[ require.resolve('@babel/preset-env', { paths: [ process.cwd() ] }), { modules: false, targets: { chrome: 61, safari: '10.1', edge: 16 } }]],
}


exports.transpile = async function transpile(content, { presetName }) {

  const options = { presets: babelPresets[presetName] }
  const { code } = await babel.transform(content, options)
  return { content: code }

}