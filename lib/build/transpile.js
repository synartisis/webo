const babel = require('babel-core')

module.exports = files => {
  files.filter(file => file.ext === 'js').forEach(file => {
    let options = file.raw ? { modules: false } : {}
    const { code, map } = babel.transform(file.built.content, { presets: [[ require.resolve('babel-preset-env'), options]], minified: true })
    file.built.content = code
  })
}