import * as html from 'syn-html-parser'
import { transpile } from '../tools/transpiler.js'
import { minify } from '../tools/minifier.js'


/** @type {(source: string, filename: string, config: Webo.Config) => Promise<{ content: string }>} */
export async function parse(source, filename, config) {

  let result = { content: source }

  const document = html.parseFragment(`${source.replace(/<template/g, '<vue-template').replace(/<\/template>/g, '<\/vue-template>')}`)

  const templateEl = html.qs(document, el => el.tagName === 'vue-template')
  const template = templateEl ? html.serialize(templateEl) : ''

  const scriptEl = html.qs(document, el => el.tagName === 'script')
  const script = scriptEl ? html.serialize(scriptEl) : 'export default {}'

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
