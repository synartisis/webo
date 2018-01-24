const { JSDOM } = require('jsdom')
const { readFileAsync } = require('../utils/helpers.js')


module.exports = async function vue(file) {

  if (file.filename.endsWith('.vue')) {
    file.sourceFilename = file.filename
    file.filename += '.js'
  }

  const source = (await readFileAsync(file.sourceFilename)).toString()
  const dom = new JSDOM(source)
  let document = dom.window.document

  const template = document.querySelector('template').innerHTML
  let script = document.querySelector('script').textContent

  const content = script.replace('export default {', `export default {\n  template: \`${template}\`,\n  `)

  Object.assign(file, { content, deps: [] })
  return file

}
