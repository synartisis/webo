import * as staticFiles from './static/static.js'

/** @type {{[filename: string]: Webo.File}} */
export const files = {}


/** @type {(filename: string) => Webo.File} */
export function getFile(filename) {
  let file = files[filename]
  if (!file) {
    file = files[filename] = createFile()
  }
  if (file.content) return file

  const staticContent = staticFiles.getFile(filename.replace(/\\/g, '/').split('/').pop() ?? '')
  if (staticContent) {
    Object.assign(file, { content: staticContent, type: 'raw' })
  }

  return file
}


/** @type {(deps: Webo.FileDeps) => void} */
export function attachFiles(deps) {
  Object.keys(deps).filter(k => !files[k]).forEach(k => files[k] = { ...createFile(), ...deps[k] })
}


/** @type {(filename: string, source: string) => Webo.FileTypes} */
export function detectType(filename, source) {
  if (/\.legacy\.m?js/.test(filename)) return 'js-legacy'
  if (filename.includes('.min.')) return 'raw'
  const ext = filename.split('.').pop() ?? ''
  if (ext === 'html' || ext === 'css' || ext === 'vue') return ext
  if (ext === 'mjs') return 'js-module'
  if (ext === 'js') return detectJsType(source)
  return 'raw'
}


export function createFile() {
  return {
    type: null,
    content: undefined,
    deps: {},
    hash: undefined,
    parseCount: 0,
  }
}


/** @type {(source: string) => 'js-module' | 'js-script'} */
function detectJsType(source) {
  if (/(^|\n)\s*\bexport\b/.test(source)) return 'js-module'
  return 'js-script'
}