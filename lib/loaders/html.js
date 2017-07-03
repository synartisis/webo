const { JSDOM } = require('jsdom')

module.exports = async (content, options) => {

  const { mode, bundle, layout } = options
  if (!content) return

  if (mode === 'dev') {
    if (content.indexOf('</body>') !== -1) {
      content = content.replace('</body>', '<script src="/webo/webo-socket.js"></script>\n</body>')
    } else {
      content += '<script src="/webo/webo-socket.js"></script>\n</body>'
    }
  }

  if (bundle) {
    const dom = new JSDOM(content)
    const document = dom.window.document
    const scripts = [...document.querySelectorAll('script')]
    scripts.forEach(script => script.removeAttribute('type'))
    content = dom.serialize()
  }

  if (layout) {
    const layoutContent = require('fs').readFileSync(layout, 'utf8')
    content = layoutContent.replace('{{ body }}', content)
  }

  return content
  
}