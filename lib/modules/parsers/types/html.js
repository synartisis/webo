const { JSDOM } = require('jsdom')
const { htmlDeps, readFileAsync, calcAssetPath } = require('../utils/helpers.js')
const { applyIncludes } = require('./html-includes.js')


module.exports = async function html(file, source) {

  const { bundle, transpile, hash, legacy } = global.parserOptions
  const legacyScripts = new Map

  if (!source) source = (await readFileAsync(file.filename)).toString()
  let { content, includesDeps } = await applyIncludes(file.filename, source, global.options.srcRoot)

  const dom = new JSDOM(content)
  let document = dom.window.document

  if (global.options.mode === 'dev') {
    const weboSocket = document.createElement('script')
    weboSocket.src = '/webo/webo-socket.js'
    document.body.appendChild(weboSocket)
  }

  if (legacy) {
    const moduleScripts = [...document.querySelectorAll('script[type="module"]')]
    moduleScripts.forEach(script => {
      const legacyScript = document.createElement('script')
      legacyScript.src = script.src.replace(/\.js$/, '.legacy.js')
      legacyScript.setAttribute('nomodule', '')
      legacyScript.setAttribute('defer', '')
      legacyScripts.set(legacyScript, calcAssetPath(file.filename, script.src))
      script.parentNode.insertBefore(legacyScript, script)
    })
  }
  
  const deps = htmlDeps(document).map(el => {
    const ref = el['href'] || el['src']
    const depFilename = calcAssetPath(file.filename, ref)
    const type = resolveDepType(el)
    const dep = { filename: depFilename, type, ref, referrer: file.filename }
    if (ref.endsWith('.min.js') || ref.endsWith('.min.css')) dep.type = 'raw'
    const legacyScript = legacyScripts.get(el)
    if (legacyScript) {
      Object.assign(dep, { sourceFilename: legacyScript, type: 'js-legacy' })
    }
    return dep
  })
  includesDeps.forEach(includeDepFilename => {
    const includeDep = { filename: includeDepFilename, type: 'dep' }
    deps.push(includeDep)
  })

  if (transpile || legacy) {
    const weboEnvScript = document.createElement('script')
    weboEnvScript.src = '/assets/webo-env.min.js'
    weboEnvScript.setAttribute('nomodule', '')
    document.head.appendChild(weboEnvScript)
  }

  file.content = dom.serialize()
  file.deps = deps.filter((v, idx, arr) => arr.findIndex(o => o.filename === v.filename) === idx)

  return file

}


function resolveDepType(el) {
  if (el.nodeName === 'SCRIPT') {
    return String(el.type).toLowerCase() === 'module' ? 'js-module' : 'js-script'
  }
  if (el.nodeName === 'LINK') {
    if (String(el.getAttribute('rel')).toLowerCase() === 'stylesheet') return 'css'
  }
  return 'raw'
}