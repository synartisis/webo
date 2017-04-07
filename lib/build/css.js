const postcss = require('postcss')
const url = require("postcss-url")
const crypto = require('crypto')
const fs = require('fs')

function calcHash(content, length = 6) {
  return crypto.createHash('md5').update(content).digest('hex').substring(0, length)
}

function calcFileHash(path, length = 6) {
  const content = fs.readFileSync(path)
  return calcHash(content, length)
}

async function cacheBusting(file, files) {
  const result = await postcss()
    .use(url({ url: asset => {
      const dep = file.deps.find(o => o.url === asset.relativePath)
      if (dep) {
        const depFile = files.find(o => o.path === dep.path)
        if (depFile) {
          if (!depFile.built || !depFile.built.path) {
            const hash = depFile.built.content ? calcHash(depFile.built.content) : calcFileHash(depFile.path)
            depFile.built = {
              hash,
              path: depFile.path.substring(0, depFile.path.length - depFile.ext.length - 1) + '-' + hash + '.' + depFile.ext
            }
          }
          return dep.url.substring(0, dep.url.length - depFile.ext.length - 1) + '-' + depFile.built.hash + '.' + depFile.ext
        }
      }
      return asset.relativePath
    }}))
    .process(file.content)
  return result.css
}


module.exports = files => Promise.all(
  files.filter(file => file.ext === 'css').map(async file => {
    file.built.content = await cacheBusting(file, files)
  })
)