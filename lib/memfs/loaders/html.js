const { JSDOM } = require('jsdom')
const path = require('path')

const { relPath } = require('../../utils')
const handlebars = require('./html-handlebars')


function discoverDeps(doc, selector, urlAttr, rootPath) {
  return [... doc.querySelectorAll(selector)].map(el => { 
    let type = null
    if (el.nodeName === 'SCRIPT') {
      type = (el.type || '').toLowerCase() === 'module' ? 'module' : 'script'
      el.type = 'text/javascript'
      el.setAttribute('webo-type', type)
    }
    if (el.nodeName === 'LINK') type = 'stylesheet'
    if (el.nodeName === 'IMG') type = 'raw'
    return { url: el[urlAttr], path: relPath(rootPath + '/' + el[urlAttr]), type } 
  })  
}


module.exports = function(options) {

  if (options.layout) handlebars.call(this, options)
  const dom = new JSDOM(this.content || this.source)
  const document = dom.window.document
  if (options.layout && options.layout.path === this.path) {
    this.exclude = true
  } else {
    const weboScript = document.createElement('script')
    weboScript.src = '/webo/webo.js'
    weboScript.setAttribute('webo-path', this.path)
    document.body.appendChild(weboScript)
  }

  const dirname = path.dirname(this.path)
  const deps = [
    ... discoverDeps(document, 'link[rel=stylesheet]', 'href', dirname),
    ... discoverDeps(document, 'script[src]', 'src', dirname).filter(o => !o.url.startsWith('/webo/')),
    ... discoverDeps(document, 'img[src]', 'src', dirname),
  ]
  this.deps = deps
  this.content = dom.serialize()

}