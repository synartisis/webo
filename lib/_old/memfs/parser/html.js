module.exports = {

  async load() {

    const { applyLayout } = require('./html-layout.js')
    const { JSDOM } = require('jsdom')
    const { htmlDeps } = require('./parse-helpers.js')
  
    const { bundle, transpile, hash, legacy } = this.options.parserOptions
    const { getHash } = this.options
  
    let source = (await this.loadSource()).toString()
    let { content, layoutPath } = await applyLayout(this.filename, source, this.options.srcRoot)
  
    const dom = new JSDOM(content)
    let document = dom.window.document
  
    if (this.options.mode === 'dev') {
      const weboSocket = document.createElement('script')
      weboSocket.src = '/webo/webo-socket.js'
      document.body.appendChild(weboSocket)
    }

    if (legacy) {
      const moduleScripts = [...document.querySelectorAll('script[type="module"]')]
      await Promise.all(
        moduleScripts.map(async script => {
          const legacy = document.createElement('script')
          legacy.src = script.src.replace(/\.js$/, '.legacy.js')
          legacy.setAttribute('nomodule', 'nomodule')
          script.parentNode.insertBefore(legacy, script)
          const legacyFilename = this.calcAssetPath(this.filename, legacy.src)
          console.log(legacyFilename)
          const legacyDep = this.attachFile(legacyFilename, null, { sourceFilename: this.calcAssetPath(this.filename,script.src) })
          // await legacyDep.parse()
        }))
    }
    
    
    const deps = await Promise.all(htmlDeps(document).map(async el => {
      const attr = el['href'] ? 'href' : 'src'
      const depFilename = this.calcAssetPath(this.filename, el[attr])
      // console.log(depFilename)
      const dep = this.attachFile(depFilename, el.type)
      await dep.parse()
      dep.referrer = this
      if (hash) {
        const depHash = await dep.getHash()
        if (dep.ext === 'css') console.log('CSS*', dep.filename, dep.hash)
        const ending = "." + el[attr].split('.').pop()
        el[attr] = el[attr].replace(ending, '-' + depHash + ending)
      }
      return dep
      // return {
      //   filename: depFilename,
      //   type: el.type === 'module' ? 'module' : null,
      // }
    }))
    if (layoutPath) {
      const depLayout = this.attachFile(layoutPath)
      await depLayout.parse()
      depLayout.referrer = this
      this.referrer = depLayout
      deps.push(depLayout)
    }
  
    // if (bundle) {
    //   const scripts = [...document.querySelectorAll('script[type="module"]')]
    //   scripts.forEach(script => script.removeAttribute('type'))
    // }
    
    if (transpile) {
      const weboPolyfill = document.createElement('script')
      weboPolyfill.src = '/assets/webo-polyfill.min.js'
      document.head.appendChild(weboPolyfill)
    }
  
    this.content = dom.serialize()
    this.deps = deps

  }

}