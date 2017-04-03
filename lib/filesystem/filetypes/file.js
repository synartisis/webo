const fs = require('fs')
const path = require('path')

module.exports = {

  path: null,
  content: null,
  deps: [],
  ext: null,
  type: null,

  async load() {
    // console.log('no loader defined')
  },

  readFile(encoding = 'utf-8') {
    return new Promise((resolve, reject) => fs.readFile(this.path, encoding, (err, data) => err ? reject(err) : resolve(data)))
  },

  filename() {
    const pathParts = this.path.split('/')
    return pathParts[pathParts.length - 1]
  },

  dirname() {
    return path.dirname(this.path)
  },

}