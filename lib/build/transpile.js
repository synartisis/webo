const babel = require('babel-core')

module.exports = files => {
  files.filter(file => file.ext === 'js' && file.built.content).forEach(file => {
    const { code, map } = babel.transform(file.built.content, { presets: ['babel-preset-env'].map(require.resolve), minified: true })
    file.built.content = code
  })
}