const static = require('./static/static.js')

const files = exports.files = {}


exports.getFile = function getFile(filename) {
  let file = files[filename]
  if (!file) {
    file = files[filename] = {}
  }
  if (file.content) return file

  const staticContent = static.getFile(filename.replace(/\\/g, '/').split('/').pop())
  if (staticContent) {
    Object.assign(file, { content: staticContent, type: 'raw' })
  } else {
    if (!file.type) file.type = getType(filename)
  }

  return file
}


exports.attachFiles = function attachFiles(deps) {
  Object.keys(deps).filter(k => !files[k]).forEach(k => files[k] = deps[k])
}


function getType(filename) {
  if (/\.legacy\.m?js/.test(filename)) return 'js-legacy'
  if (filename.includes('.min.')) return 'raw'
  const ext = filename.split('.').pop()
  if (ext === 'mjs') return 'js-module'
  if (ext === 'js') return 'js-script'
  if (['html', 'css', 'vue'].includes(ext)) return ext
  return 'raw'
}
