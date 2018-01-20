const { JSDOM } = require('jsdom')
const htmlParser = require('./html.js')

const { readFileAsync } = require('../utils/helpers.js')
const bundler = require('../utils/bundler.js')
const transpiler = require('../utils/transpiler.js')
const minifier = require('../utils/minifier.js')


module.exports = async function vue(file) {

  if (file.filename.endsWith('.vue')) {
    file.sourceFilename = file.filename
    file.filename = file.filename.replace(/\.vue$/, '.html')
  }
  
  let vueDeps = []
  const { transpile, minify } = global.parserOptions

  const vueId = 'vue-' + Math.trunc(Math.random() * 10e10)

  let source = (await readFileAsync(file.sourceFilename)).toString()
  source = source.replace('<template>', `<div id="${vueId}">`).replace('</template>', '') + '</div>'

  Object.assign(file, await htmlParser(file, source))

  const dom = new JSDOM(file.content)
  let document = dom.window.document

  const vueHandle = document.querySelector(`div[id="${vueId}"]`)
  const vueScripts = vueHandle.querySelectorAll('script')
  if (vueScripts.length > 1) throw new Error(`vue files must have up to 1 script element [${file.sourceFilename}]`)
  const vueScript = vueScripts[0]
  // vueScript.setAttribute('type', 'module')
  if (vueScript) {
    let scriptContent = vueScript.textContent

    let { content, deps, bundleName } = await bundler(file, { format: 'iife', entrySource: scriptContent, entryFilename: file.sourceFilename })
    vueDeps = deps
    
    if (transpile) {
      content = await transpiler(content, file, { preset: 'legacy' })
    }
  
    if (minify) {
      content = await minifier(content, file)
    }
    
    content += ` new Vue(Object.assign(${bundleName}, { el: '#${vueId}' }))`
    vueScript.textContent = content
  }

  Object.assign(file, { content: dom.serialize(), deps: vueDeps })
  return file

}
