const path = require('path')

module.exports.createDep = (referrer, rel, type, root) => {
  return {
    path: rel.startsWith('http') ? rel : path.resolve(path.dirname(referrer), rel).split('?')[0],
    ref: referrer,
    rel,
    type,
    root,
  }
}