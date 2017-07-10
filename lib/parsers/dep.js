const path = require('path')
const { state } = require('../state')

module.exports.createDep = (referrer, rel, type, root) => {
  let depPath
  if (rel.startsWith('http')) {
    depPath = rel
  } else if (rel.startsWith('/')) {
    depPath = state.config.srcRoot + rel
  } else {
    depPath = path.relative('.' , path.resolve(path.dirname(referrer), rel.split('?')[0])).replace(/\\/g, '/')
  }
  // if (rel.endsWith('.pdf')) {
  //   console.log({ referrer, rel, type, root })
  //   console.log(depPath)
  // }
  return {
    path: depPath,
    // path: rel.startsWith('http') ? rel : path.relative('.' , path.resolve(path.dirname(referrer), rel.split('?')[0])).replace(/\\/g, '/'),
    // path: rel.startsWith('http') ? rel : path.resolve(path.dirname(referrer), rel).split('?')[0],
    ref: referrer,
    rel,
    type,
    root,
  }
}