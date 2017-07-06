const path = require('path')
const { JSDOM } = require('jsdom')

module.exports = async (content, options) => {

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



function applyLayout(content, layout, filename) {
  let relPath = path.relative(path.dirname(filename), path.dirname(layout))
  if (relPath) relPath += '/'
  console.log(filename, relPath)
  const layoutContent = require('fs').readFileSync(layout, 'utf8')
  const domLayout = new JSDOM(layoutContent)
  fixPaths([... domLayout.window.document.querySelectorAll('link[rel="stylesheet"]')], 'href', relPath)
  fixPaths([... domLayout.window.document.querySelectorAll('script[src]')], 'src', relPath)
  fixPaths([... domLayout.window.document.querySelectorAll('img[src]')], 'src', relPath)
  fixPaths([... domLayout.window.document.querySelectorAll('link[rel="icon"]')], 'href', relPath)
  fixPaths([... domLayout.window.document.querySelectorAll('a[href]')], 'href', relPath)
  // fixPaths([... domLayout.window.document.querySelectorAll('a[href$=".pdf"]')], 'href', relPath)
  // ;[... domLayout.window.document.querySelectorAll('link[rel="stylesheet"]')].filter(o => !o.href.startsWith('http')).forEach(o => o.href = relPath + o.href)
  // ;[... domLayout.window.document.querySelectorAll('script[src]')].filter(o => !o.src.startsWith('http')).forEach(o => o.src = relPath + o.src)
  // ;[... domLayout.window.document.querySelectorAll('img[src]')].filter(o => !o.src.startsWith('http')).forEach(o => o.src = path.normalize(relPath + o.src).replace('/\\/g', '/'))
  return domLayout.serialize().replace('{{{ body }}}', content)
}

function fixPaths(elements, attr, relPath) {
  elements.filter(el => !el[attr].startsWith('http')).forEach(el => el[attr] = (relPath + el[attr]).replace('about:blank', ''))
  // elements.filter(el => !el[attr].startsWith('http')).forEach(el => el[attr] = path.normalize(relPath + el[attr]).replace(/\\/g, '/'))
}