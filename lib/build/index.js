const { context } = require('../filesystem/utils')
const config = require('../config')
const copy = require('./copy')
const transpile = require('./transpile')
const minify = require('./minify')
const html = require('./html')

module.exports = (roots, files) => {
  const filesToBuild = files.filter(o => !o.built || !o.built.hash)
  filesToBuild.forEach(o => o.built = { content: o.content, hash: null })
  try {
    transpile(filesToBuild)
    minify(filesToBuild)
    html(files)
    copy(config, context, roots, files)
  } catch (error) {
    return { status: 'error', message: error.toString() }
  }

  return { status: 'done' }
}