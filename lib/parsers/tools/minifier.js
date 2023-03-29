import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)


/** @type {any} */
let terser


/** @type {(content: string) => Promise<{ content: string }>} */
export async function minify(content) {

  if (!terser) terser = require(require.resolve('terser', { paths: [ process.cwd() ] }))
  const { code, error } = await terser.minify(content)
  if (error) log(error)

  return { content: code }

}