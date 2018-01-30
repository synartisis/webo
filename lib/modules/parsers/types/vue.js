const { JSDOM } = require('jsdom')
const { readFileAsync, htmlDeps, calcAssetPath } = require('../utils/helpers.js')


module.exports = async function vue(file) {

  if (file.filename.endsWith('.vue')) {
    file.sourceFilename = file.filename
    file.filename += '.js'
  }

  const source = (await readFileAsync(file.sourceFilename)).toString()
  const dom = new JSDOM(`<html><head></head><body>${source.replace(/template/g, 'tmpl')}</body></html>`)
  let document = dom.window.document

  const templateEl = document.querySelector('tmpl')
  const template = templateEl ? templateEl.innerHTML : ''
  const scriptEl = document.querySelector('script')
  const script = scriptEl ? scriptEl.textContent : 'export default {}'

  const content = script.replace('export default {', `export default {\n  template: \`${template}\`,\n  `)

  const deps = htmlDeps(document).map(el => {
    const ref = el['href'] || el['src']
    const depFilename = calcAssetPath(file.filename, ref)
    const type = resolveDepType(el)
    const dep = { filename: depFilename, type, ref }
    if (ref.endsWith('.min.js') || ref.endsWith('.min.css')) dep.type = 'raw'
    return dep
  })

  Object.assign(file, { content, deps })
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