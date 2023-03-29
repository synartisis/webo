import * as parse5 from '../tools/parse5.js'
import { transpile } from '../tools/transpiler.js'
import { minify } from '../tools/minifier.js'


/** @type {(source: string, filename: string, config: Webo.Config) => Promise<{ content: string }>} */
export async function parse(source, filename, config) {

  let result = { content: source }

  const document = parse5.parseFragment(`${source.replace(/<template/g, '<vue-template').replace(/<\/template>/g, '<\/vue-template>')}`)

  const templateEl = parse5.qs(document, el => el.name === 'vue-template')
  const template = templateEl ? parse5.serialize(templateEl) : ''

  const scriptEl = parse5.qs(document, el => el.name === 'script')
  const script = scriptEl ? parse5.serialize(scriptEl) : 'export default {}'

  result.content = script.replace('export default {', `export default {\n  template: \`${template}\`,\n  `)

  if (config.transpile) {
    const transpileResult = await transpile(result.content, { presetName: 'transpileModern' })
    Object.assign(result, transpileResult)
  }

  if (config.minify) {
    const minifyResult = await minify(result.content)
    Object.assign(result, minifyResult)
  }

  return result

}
