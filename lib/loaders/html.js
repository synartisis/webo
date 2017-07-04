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
  const layoutContent = require('fs').readFileSync(layout, 'utf8')
  const domLayout = new JSDOM(layoutContent)
  domLayout.window.document.querySelectorAll('link[rel="stylesheet"]').forEach(o => o.href = relPath + o.href)
  domLayout.window.document.querySelectorAll('script[src]').forEach(o => o.src = relPath + o.src)
  domLayout.window.document.querySelectorAll('img[src]').forEach(o => o.src = relPath + o.src)
  return domLayout.serialize().replace('{{ body }}', content)
}