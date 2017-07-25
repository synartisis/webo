const path = require('path')
const { JSDOM } = require('jsdom')

const { hashFilename } = require('./hasher')



module.exports = async function(content, options) {
  const { resolvePath } = require('../utils')
  const { mode, filename, bundle, layout, hash } = options
  

  if (layout) content = await applyLayout(content, layout, filename)
    
  const dom = new JSDOM(content)
  const document = dom.window.document
  
  if (mode === 'dev') {
    const weboSocket = document.createElement('script')
    weboSocket.src = '/webo/webo-socket.js'
    document.body.appendChild(weboSocket)
  }
  
  if (bundle) {
    const scripts = [...document.querySelectorAll('script')]
    scripts.forEach(script => script.removeAttribute('type'))
  }

  const elements = htmlDeps(document)
  const assets = await Promise.all(elements.map(async el => {
    const attr = el['href'] ? 'href' : 'src'
    const asset = {
      ref: filename,
      rel: el[attr],
      type: el.type === 'module' ? 'module' : null,
    }
    if (hash) {
      const hashRel = await hashFilename(resolvePath(filename, el[attr]))
      el[attr] = el[attr].split('.').map((o, i, c) => i === c.length - 2 ? o + '-' + hashRel : o).join('.')
      // el[attr] = await hashFilename(resolvePath(filename, el[attr]))
      // const hash = await getHash(filename)
      // el[attr] = injectHash(el[attr], hash)
    }
    return asset
  }))
  return { content: dom.serialize(), assets }
}






async function applyLayout(content, layout, filename) {
  const { readFileAsync } = require('../utils')
  if (layout === filename) return content
  const layoutContent = await readFileAsync(layout, 'utf8')
  const domLayout = new JSDOM(layoutContent)
// console.log('555', layoutContent)
  let layoutRelPath = path.relative(path.dirname(filename), path.dirname(layout))
  // layoutRelPath ? layoutRelPath += '/' : layoutRelPath = ''
  const layoutDeps = htmlDeps(domLayout.window.document, true)
  layoutDeps.forEach(el => {
    let attr = el['href'] ? 'href' : 'src'
    el[attr] = layoutRelPath + ( !layoutRelPath.endsWith('/') && !el[attr].startsWith('/') ? '/' : '' ) + el[attr].replace('about:blank', '')
if (el[attr].endsWith('//')) el[attr] = el[attr].substring(0, el[attr].length - 2) // HACK
  })
  return domLayout.serialize().replace('{{{ body }}}', content)
}



function htmlDeps(document, includeHtmlLinks = false) {
  const deps = [
    ...[... document.querySelectorAll('script[src]:not([type="module"])')],
    ...[... document.querySelectorAll('script[src][type="module"]')],
    ...[... document.querySelectorAll('link[rel="stylesheet"]')],
    ...[... document.querySelectorAll('link[rel="icon"]')],
    ...[... document.querySelectorAll('img[src]')],
    ...[... document.querySelectorAll('a[href$=".pdf"]')],
  ].filter(el => el.href ? !el.href.startsWith('http:') && !el.href.startsWith('https:') : !el.src.startsWith('http:') && !el.src.startsWith('https:') && !el.src.startsWith('/webo/'))
  if (includeHtmlLinks) deps.push(...[... document.querySelectorAll('a[href]')])
  return deps
}
