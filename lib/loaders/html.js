const { JSDOM } = require('jsdom')

module.exports = async (content, options) => {

  const { mode, bundle } = options
  if (!content) return

  if (mode === 'dev') {
    content = content.replace('</body>', '<script src="/webo/webo-socket.js"></script>\n</body>')
  }

  if (bundle) {
    const dom = new JSDOM(content)
    const document = dom.window.document
    const scripts = [...document.querySelectorAll('script')]
    scripts.forEach(script => script.removeAttribute('type'))
    content = dom.serialize()
  }

  return content
  
}