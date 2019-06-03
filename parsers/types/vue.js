const parse5 = require('../utils/parse5.js')

exports.parse = async function parse(source, filename, config) {

  let result = { content: source }

  const document = parse5.parseFragment(`${source.replace(/template/g, 'tmpl')}`)

  const templateEl = parse5.qs(document, el => el.name === 'tmpl')
  const template = templateEl ? parse5.serialize(templateEl) : ''

  const scriptEl = parse5.qs(document, el => el.name === 'script')
  const script = scriptEl ? parse5.serialize(scriptEl) : 'export default {}'

  result.content = script.replace('export default {', `export default {\n  template: \`${template}\`,\n  `)

  if (config.transpile) {
    const { transpile } = require('../utils/transpiler.js')
    const transpileResult = await transpile(result.content, { presetName: 'transpileModern' })
    Object.assign(result, transpileResult)
  }

  if (config.minify) {
    const { minify } = require('../utils/minifier.js')
    const minifyResult = await minify(result.content)
    Object.assign(result, minifyResult)
  }

  return result

}
