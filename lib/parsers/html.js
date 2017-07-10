const path = require('path')
const { JSDOM } = require('jsdom')

const { createDep } = require('./dep')
const parsers = require('.')



module.exports.load = async function load(content, options) {
  const { mode, filename, bundle, layout } = options
  if (!content) return content

  if (layout) content = applyLayout(content, layout, filename)

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

  return dom.serialize()
}




module.exports.resolveDeps = async function resolveDeps(content, options) {
  const { filename } = options
  try {
    const dom = new JSDOM(content)
    const document = dom.window.document
  
    let assets = [
      ...[... document.querySelectorAll('script[src]:not([type="module"])')].filter(o => !o.src.startsWith('http')).map(o => createDep(filename, o.src, 'script', filename)),
      ...[... document.querySelectorAll('script[src][type="module"]')].filter(o => !o.src.startsWith('http')).map(o => createDep(filename, o.src, 'module', filename)),
      ...[... document.querySelectorAll('link[rel="stylesheet"]')].filter(o => !o.href.startsWith('http')).map(o => createDep(filename, o.href, 'css', filename)),
      ...[... document.querySelectorAll('link[rel="icon"]')].filter(o => !o.href.startsWith('http')).map(o => createDep(filename, o.href, null, filename)),
      ...[... document.querySelectorAll('img[src]')].filter(o => !o.src.startsWith('http')).map(o => createDep(filename, o.src, 'img', filename)),
      ...[... document.querySelectorAll('a[href$=".pdf"]')].filter(o => !o.href.startsWith('http')).map(o => createDep(filename, o.href, 'pdf', filename)),
    ]

    let css = await Promise.all(assets.filter(o => o.type === 'css').map(o => parsers.css.resolveDeps(o.path, { root: filename })))
    css.map(o => assets.push(... o))
  
    let js = await Promise.all(assets.filter(o => o.type === 'script' || o.type === 'module').map(o => parsers.js.resolveDeps(o.path, { root: filename, type: o.type })))
    js.map(o => assets.push(... o))
    
    // console.log(assets)
    return assets
  } catch (error) {
    console.error(`Error parsing ${filename} - ${error.message}`)
    return []
  }
}





function applyLayout(content, layout, filename) {
  let relPath = path.relative(path.dirname(filename), path.dirname(layout))
  if (relPath) relPath += '/'
  const layoutContent = require('fs').readFileSync(layout, 'utf8')
  const domLayout = new JSDOM(layoutContent)
  fixPaths([... domLayout.window.document.querySelectorAll('link[rel="stylesheet"]')], 'href', relPath)
  fixPaths([... domLayout.window.document.querySelectorAll('script[src]')], 'src', relPath)
  fixPaths([... domLayout.window.document.querySelectorAll('img[src]')], 'src', relPath)
  fixPaths([... domLayout.window.document.querySelectorAll('link[rel="icon"]')], 'href', relPath)
  fixPaths([... domLayout.window.document.querySelectorAll('a[href]')], 'href', relPath)
  // fixPaths([... domLayout.window.document.querySelectorAll('a[href$=".pdf"]')], 'href', relPath)
  return domLayout.serialize().replace('{{{ body }}}', content)
}

function fixPaths(elements, attr, relPath) {
  elements.filter(el => !el[attr].startsWith('http')).forEach(el => el[attr] = (relPath + el[attr]).replace('about:blank', '').replace('//', '/'))
}