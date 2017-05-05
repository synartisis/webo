const { context, log } = require('../utils')
const config = require('../config')
const transpile = require('./transpile')
const minify = require('./minify')
const html = require('./html')
const css = require('./css')
const copy = require('./copy')
const { notifyWebo } = require('../watchers/clientWatcher')

module.exports = async (roots, files) => {
  const filesToBuild = files.filter(o => o.type)//.filter(o => !o.built || !o.built.hash)
  filesToBuild.forEach(o => o.built = { content: (o.content || '').replace('var process = { env: { NODE_ENV: "development" } };\n', 'var process = { env: { NODE_ENV: "production" } };\n'), hash: null })
  // filesToBuild.forEach(o => o.built = { content: (o.content || '').replace(/"WEBO_development"/g, '"production"'), hash: null })
  try {
    notify('VERBOSE', 'transpile')
    transpile(filesToBuild)
    notify('VERBOSE', 'minify')
    minify(filesToBuild)
    notify('VERBOSE', 'html')
    html(filesToBuild, roots)
    notify('VERBOSE', 'css')
    await css(filesToBuild)
    notify('VERBOSE', 'copy', config.paths)
    copy(config, context, roots, files.filter(o => !o.exclude))
    notify('VERBOSE', 'done')
  } catch (error) {
    notify(error.toString())
    return { status: 'error', message: error.toString() }
  }

  return { status: 'done' }
}

function notify(... args) {
  log(... args)
  notifyWebo({ action: 'log', data: args.filter(o => !['VERBOSE'].includes(o)).map(o => !o || typeof o !== 'object' ? o : JSON.stringify(o, null, 2)).join(' ') + '\n' })
}