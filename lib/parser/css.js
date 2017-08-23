const path = require('path')
const postcss = require('postcss')
const url = require("postcss-url")
const atImport = require("postcss-import")

const { hashFilename, getHash } = require('./hasher')
const utils = require('../utils')



module.exports = async function(content, options) {
  const { mode, root, filename, bundle, hash } = options

  const dirname = path.dirname(filename)
  
  const assets = []
  let result = await postcss()
    .use(atImport({ path: dirname }))
    .use(url({ url: asset => { 
      if (!asset.url.startsWith('http:') && !asset.url.startsWith('https:')) {
        assets.push({ ref: filename, rel: asset.url, type: 'img' })
      }
      return asset.url
    }}))
    .process(content)

  if (hash) {
    result = await applyHashes(result.css, assets, filename)

  }

    return { content: result.css, assets }
}



async function applyHashes(content, assets, filename) {

  await Promise.all(assets.map(async asset => {
    const hashRel = await hashFilename(utils.resolvePath(filename, asset.rel))
    asset.hashed = asset.rel.split('.').map((o, i, c) => i === c.length - 2 ? o + '-' + hashRel : o).join('.')
  }))

  const result = await postcss().use(url({ url: asset => {
    const found = assets.find(o => o.rel === asset.url)
    if (found) {
      asset.url = found.hashed
      // delete found.hashed
    }
    return asset.url
  }}))
  .process(content)

  return result
}