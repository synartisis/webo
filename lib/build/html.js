const jsdom = require('jsdom')
const crypto = require('crypto')
const fs = require('fs')
const mime = require('mime')
const config = require('../config')
const babelPolyfill = fs.readFileSync(require.resolve('babel-polyfill/dist/polyfill.min.js'), 'utf8')

function removeweboArtifacts(document) {
  const weboScript = document.querySelector('script[src="/webo/webo.js"]')
  if (weboScript) weboScript.parentNode.removeChild(weboScript)
  ;[... document.querySelectorAll('[webo]')].forEach(el => el.removeAttribute('webo'))
}

function calcHash(content, length = 6) {
  return crypto.createHash('md5').update(content).digest('hex').substring(0, length)
}

function calcFileHash(path, length = 6) {
  const content = fs.readFileSync(path)
  return calcHash(content, length)
}

function hashElement(depFile, document, tag, attr, url) {
  const el = document.querySelector(`${tag}[${attr}="${url}"]`)
  if (el) {
    const ext = url.split('.').pop()
    el[attr] = url.substring(0, url.length - ext.length - 1) + '-' + depFile.built.hash + '.' + ext
    depFile.built.path = depFile.path.substring(0, depFile.path.length - ext.length - 1) + '-' + depFile.built.hash + '.' + ext
  }
}

function cacheBusting(document, files, deps) {
  deps.forEach(dep => {
    const depFile = files.find(o => o.path === dep.path)
    if (!depFile) return
    depFile.built.hash = depFile.built.content ? calcHash(depFile.built.content) : calcFileHash(depFile.path)
    const depExt = dep.url.split('.').pop()
    if (depExt === 'js') hashElement(depFile, document, 'script', 'src', dep.url)
    if (depExt === 'css') hashElement(depFile, document, 'link', 'href', dep.url)
    if (mime.types[depExt] && mime.types[depExt].split('/')[0] === 'image') hashElement(depFile, document, 'img', 'src', dep.url)
  })
}

function injectBabelPolyfill(document, file, files) {
  if (config.vendorFilename) {
    const vendorFileDep = file.deps.find(o => o.path === file.dirname() + '/' + config.vendorFilename.replace(/\.js$/, '') + '.js')
    if (vendorFileDep) {
      const vendorFile = files.find(o => o.path === vendorFileDep.path)
      if (vendorFile) {
        vendorFile.built.content = babelPolyfill + '\n' + vendorFile.built.content
        return
      }
    }
  }
  const firstScript = document.querySelector('script')
  if (!firstScript) return
  const babelScript = document.createElement('script')
  babelScript.textContent = babelPolyfill
  firstScript.parentNode.insertBefore(babelScript, firstScript)
}

function injectVendorScript(document, hash) {
  // const firstweboScript = document.querySelector('script[webo]')
  // if (!firstweboScript) return false
  const vendorScript = document.querySelector('script[src="vendor.js"]')
  if (!vendorScript) return false
  
  // const vendorScript = document.createElement('script')
  vendorScript.src = `vendor-${hash}.js`
  // firstweboScript.parentNode.insertBefore(vendorScript, firstweboScript)
  return true
}

module.exports = files => {
  files.filter(file => file.ext === 'html').forEach(file => {
    const { document } = jsdom.jsdom(file.built.content).defaultView
    // const vendorHash = calcHash(babelPolyfill)
    // if (injectVendorScript(document, vendorHash)) {
    //   file.built.vendor = babelPolyfill
    //   file.built.vendorHash = vendorHash
    //   removeweboArtifacts(document)
    // }
    removeweboArtifacts(document)
    injectBabelPolyfill(document, file, files)
    cacheBusting(document, files, file.deps)
    file.built.content = jsdom.serializeDocument(document)
  })
}