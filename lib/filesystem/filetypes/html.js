const jsdom = require('jsdom')
const { relPath } = require('../utils')
const file = require('./file')
const config = require('../../config')
let layout = null

function discoverDeps(doc, selector, urlAttr, rootPath) {
  return [... doc.querySelectorAll(selector)].map(o => { return { url: o[urlAttr], path: relPath(rootPath + '/' + o[urlAttr]), webo: o.getAttribute('webo') } })  
}

module.exports = Object.assign({}, file, {

  async load() {
    let source = await this.readFile()
    source = applyLayout(source)
    const { document } = jsdom.jsdom(source).defaultView
    const weboScript = document.createElement('script')
    weboScript.src = '/webo/webo.js'
    weboScript.setAttribute('webo-path', this.path)
    document.body.appendChild(weboScript)
    if (config.vendorFilename) {
      const firstModuleScript = document.querySelector('script[webo]')
      if (firstModuleScript) {
        const vendorScript = document.createElement('script')
        vendorScript.src = config.vendorFilename.replace(/\.js$/, '') + '.js'
        firstModuleScript.parentNode.insertBefore(vendorScript, firstModuleScript)
      }
    }
    let rootPath = this.path.split('/')
    rootPath.pop()
    rootPath = rootPath.join('/')
    const deps = [
      ... discoverDeps(document, 'link[rel=stylesheet]', 'href', rootPath),
      ... discoverDeps(document, 'script[src]', 'src', rootPath).filter(o => !o.url.startsWith('/webo/')),
      ... discoverDeps(document, 'img[src]', 'src', rootPath),
    ]//.filter(dep => dep.url !== 'vendor.js')
    this.content = jsdom.serializeDocument(document)
    this.deps = deps
    return this
  }  

})

function applyLayout(source) {
  if (source.includes('<html ')) return source
  if (config.layout) layout = require('fs').readFileSync(config.layout, 'utf-8')
  if (layout) {
    file.layout = relPath(config.layout)
    return layout.replace(/{{{\sbody\s}}}/, source)
  }
  return source
}