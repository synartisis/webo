// const jsdom = require('jsdom')
// const { relPath } = require('../../utils')
// const file = require('./file')()
// const config = require('../../config')
// const handlebars = require('./html-handlebars')

// function discoverDeps(doc, selector, urlAttr, rootPath) {
//   return [... doc.querySelectorAll(selector)].map(el => { 
//     if (el.nodeName === 'SCRIPT' && (el.type || '').toLowerCase() === 'module') {
//       el.type = 'text/javascript'
//       el.setAttribute('webo-type', 'module')
//     }
//     return { url: el[urlAttr], path: relPath(rootPath + '/' + el[urlAttr]), type: el.getAttribute('webo-type') } 
//   })  
// }

// module.exports = () => {
//   return Object.assign({}, file, {

//     deps: [],

//     async load() {
//       this.content = await this.readFile()
//       if (config.layout) handlebars(this, { layoutPath: relPath(config.layout) })
//       if (config.layout === this.path) this.exclude = true
//       const { document } = jsdom.jsdom(this.content).defaultView
//       const weboScript = document.createElement('script')
//       weboScript.src = '/webo/webo.js'
//       weboScript.setAttribute('webo-path', this.path)
//       document.body.appendChild(weboScript)

//     const deps = [
//       ... discoverDeps(document, 'link[rel=stylesheet]', 'href', this.dirname()),
//       ... discoverDeps(document, 'script[src]', 'src', this.dirname()).filter(o => !o.url.startsWith('/webo/')),
//       ... discoverDeps(document, 'img[src]', 'src', this.dirname()),
//     ]
//     this.content = jsdom.serializeDocument(document)
//     this.deps = deps
//       return this
//     }  

//   })

// }
