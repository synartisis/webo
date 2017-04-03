const babel = require('babel-core')

module.exports = files => {
  files.filter(file => file.ext === 'js').forEach(file => {
    // let options = file.type === 'module' ? { modules: false } : {}
    // const { code, map } = babel.transform(file.built.content, { presets: [[ require.resolve('babel-preset-env'), options]], minified: true })
    const { code, map } = babel.transform(file.built.content, { presets: [[ require.resolve('babel-preset-env'), { modules: false }]] })
    file.built.content = code
  })
}