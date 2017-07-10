const path = require('path')

module.exports.createDep = (referrer, rel, type, root) => {
  const { state } = require('../state')
  if (rel.startsWith('http://') || rel.startsWith('https://')) return null
  let depPath
  if (rel.startsWith('/')) {
    depPath = state.config.srcRoot + rel
  } else {
    depPath = path.relative('.' , path.resolve(path.dirname(referrer), rel.split('?')[0])).replace(/\\/g, '/')
  }
  return {
    path: depPath,
    ref: referrer,
    rel,
    type,
    root,
  }
}