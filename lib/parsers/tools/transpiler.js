import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

/** @type {any} */
let babel
/** @type {any} */
let babelPresets

/** @type {(content: string, options: { presetName: 'transpileModern' | 'transpileLegacy' }) => Promise<{ content: string }>} */
export async function transpile(content, { presetName }) {

  if (!babel) babel = require(require.resolve('@babel/core', { paths: [ process.cwd() ] }))
  if (!babelPresets) babelPresets = {
    transpileLegacy: [[ require.resolve('@babel/preset-env', { paths: [ process.cwd() ] }), { modules: false }]],
    transpileModern: [[ require.resolve('@babel/preset-env', { paths: [ process.cwd() ] }), { modules: false, targets: { chrome: 61, safari: '10.1', edge: 16 } }]],
  }
  const options = { presets: babelPresets[presetName] }
  const { code } = await babel.transform(content, options)
  return { content: code }

}