import * as staticFiles from './static/static.js'

/** @type {{[filename: string]: Webo.File}} */
export const files = {}


export function getFile(filename) {
  let file = files[filename]
  if (!file) {
    file = files[filename] = {}
  }
  if (file.content) return file

  const staticContent = staticFiles.getFile(filename.replace(/\\/g, '/').split('/').pop())
  if (staticContent) {
    Object.assign(file, { content: staticContent, type: 'raw' })
  // } else {
    // if (!file.type) file.type = detectType(filename)
  }

  return file
}


export function attachFiles(deps) {
  Object.keys(deps).filter(k => !files[k]).forEach(k => files[k] = deps[k])
}


export function detectType(filename, source) {
  if (/\.legacy\.m?js/.test(filename)) return 'js-legacy'
  if (filename.includes('.min.')) return 'raw'
  const ext = filename.split('.').pop()
  if (['html', 'css', 'vue'].includes(ext)) return ext
  if (ext === 'mjs') return 'js-module'
  if (ext === 'js') return detectJsType(source)
  return 'raw'
}

function detectJsType(source) {
  if (/(^|\n)\s*\bexport\b/.test(source)) return 'js-module'
  return 'js-script'
}
