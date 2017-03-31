const jsdom = require('jsdom')
const { relPath } = require('../utils')
const file = require('./file')
const config = require('../../config')

function discoverDeps(doc, selector, urlAttr, rootPath) {
  return [... doc.querySelectorAll(selector)].map(o => { return { url: o[urlAttr], path: relPath(rootPath + '/' + o[urlAttr]), devo: o.getAttribute('devo') } })  
}

module.exports = Object.assign({}, file, {

  async load() {
    const source = await this.readFile()
    const { document } = jsdom.jsdom(source).defaultView
    const devoScript = document.createElement('script')
    devoScript.src = '/devo/devo.js'
    devoScript.setAttribute('devo-path', this.path)
    document.body.appendChild(devoScript)
    if (config.vendorFilename) {
      const firstModuleScript = document.querySelector('script[devo]')
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
      ... discoverDeps(document, 'script[src]', 'src', rootPath).filter(o => !o.url.startsWith('/devo/')),
      ... discoverDeps(document, 'img[src]', 'src', rootPath),
    ]//.filter(dep => dep.url !== 'vendor.js')
    this.content = jsdom.serializeDocument(document)
    this.deps = deps
    return this
  }  

})