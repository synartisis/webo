const { relPath, calcRelPath, readFileAsync, calcAssetPath, log, logv } = require('../../../utils/utils.js')


function logParserError(label, file, error) {
  log(`_LIGHTRED_Parse error: ${file.filename} [${file.type}] _GRAY_${label} ${error.toString()}`)
  if (error instanceof Error) logv(`_RED_${error.stack}`)
}


const babelPresets = {
  transpileLegacy: [[ require.resolve('@babel/preset-env'), { modules: false }]],
  transpileModern: [[ require.resolve('@babel/preset-env'), { modules: false, targets: { chrome: 61, safari: '10.1', edge: 16 } }]],
  minify: [[ require.resolve('babel-preset-minify'), { evaluate: false, mangle: false }]]
}


function htmlDeps(document, includeHtmlLinks = false) {
  const deps = [
    // ...[... document.querySelectorAll('script[src]:not([type="module"])')],
    // ...[... document.querySelectorAll('script[src][type="module"]')],
    ...[... document.querySelectorAll('script[src]')],
    ...[... document.querySelectorAll('link[rel="stylesheet"]')],
    ...[... document.querySelectorAll('link[rel~="icon"]')],
    ...[... document.querySelectorAll('img[src]')],
    ...[... document.querySelectorAll('a[href$=".pdf"]')],
  ].filter(el => el.href ? !el.href.startsWith('http:') && !el.href.startsWith('https:') : !el.src.startsWith('http:') && !el.src.startsWith('https:') && !el.src.startsWith('/webo/'))
  if (includeHtmlLinks) deps.push(...[... document.querySelectorAll('a[href]')].filter(el => !el.href.startsWith('http:') && !el.href.startsWith('https:')))
  return deps
}


module.exports = {

  logParserError,
  babelPresets,
  htmlDeps,

  relPath,
  calcRelPath,
  readFileAsync,
  calcAssetPath,
}