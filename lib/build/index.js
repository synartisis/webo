const { context, log } = require('../utils')
const config = require('../config')
const copy = require('./copy')
const transpile = require('./transpile')
const minify = require('./minify')
const html = require('./html')
const css = require('./css')
const { notifyWebo } = require('../watchers/clientWatcher')

module.exports = async (roots, files) => {
  const filesToBuild = files.filter(o => true)//.filter(o => !o.built || !o.built.hash)
  filesToBuild.forEach(o => o.built = { content: (o.content || '').replace(/"WEBO_development"/g, '"production"'), hash: null })
  try {
    notify('VERBOSE', 'transpile')
    transpile(filesToBuild)
    notify('VERBOSE', 'minify')
    minify(filesToBuild)
    notify('VERBOSE', 'html')
    html(files)
    notify('VERBOSE', 'css')
    await css(files)
    notify('VERBOSE', 'copy', config.paths)
    copy(config, context, roots, files.filter(o => !o.exclude))
    notify('VERBOSE', 'done')
  } catch (error) {
    notify(error)
    return { status: 'error', message: error.toString() }
  }

  return { status: 'done' }
}

function notify(... args) {
  log(... args)
  notifyWebo({ action: 'log', data: args.filter(o => !['VERBOSE'].includes(o)).map(o => !o || typeof o !== 'object' ? o : JSON.stringify(o, null, 2)).join(' ') + '\n' })
}