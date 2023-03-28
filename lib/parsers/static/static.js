import fs from 'node:fs'

const __dirname = new URL('.', import.meta.url).pathname
let staticFiles


export function getFile(filename) {
  if (!staticFiles) load()
  return staticFiles[filename]
}


function load() {
  let babelPolyfill = ''
  try {
    babelPolyfill = fs.readFileSync(require.resolve('@babel/polyfill/dist/polyfill.min.js', { paths: [ process.cwd() ] }), 'utf8')
  } catch (error) {}
  const weboEnv = fs.readFileSync(__dirname + '/webo-env.min.js', 'utf8')
  staticFiles = {
    'webo-env.min.js': [ babelPolyfill, weboEnv ].join('\n\n')
  }
}