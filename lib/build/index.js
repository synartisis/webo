const { context } = require('../utils')
const config = require('../config')
const copy = require('./copy')
const transpile = require('./transpile')
const minify = require('./minify')
const html = require('./html')
const css = require('./css')
const { notifyWebo } = require('../watchers/clientWatcher')

module.exports = async (roots, files) => {
  const filesToBuild = files.filter(o => true)//.filter(o => !o.built || !o.built.hash)
  filesToBuild.forEach(o => o.built = { content: o.content, hash: null })
  try {
    log('transpile')
    transpile(filesToBuild)
    log('minify')
    minify(filesToBuild)
    log('html')
    html(files)
    log('css')
    await css(files)
    log('copy', config.paths)
    copy(config, context, roots, files)
    log('done')
  } catch (error) {
    log(error)
    return { status: 'error', message: error.toString() }
  }

  return { status: 'done' }
}

function log(... args) {
  console.log(... args)
  notifyWebo({ action: 'log', data: args.map(o => !o || typeof o !== 'object' ? o : JSON.stringify(o, null, 2)).join(' ') + '\n' })
}