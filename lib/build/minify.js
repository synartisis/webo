const UglifyJS = require('uglify-js2')

module.exports = files => {
  files.filter(file => file.ext === 'js' && file.built.content).forEach(file => {
    const { code, map } = UglifyJS.minify(file.built.content, { fromString: true })
    file.built.content = code
  })
}