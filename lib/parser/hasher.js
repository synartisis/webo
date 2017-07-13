const fs = require('fs')
const crypto = require('crypto')


const cache = []


async function hashFilename(filename) {
  let hashEntry = cache.find(o => o.filename === filename)
  if (!hashEntry) {
    const hash = await calcHash(filename)
    hashEntry= {
      filename,
      hashedFilename: filename.split('.').map((o, i, c) => i === c.length - 2 ? o + '-' + hash : o).join('.'),
    }
    cache.push(hashEntry)
  }
  return hashEntry.hashedFilename
}


function unhashFilename(hashedFilename) {
  let hashEntry = cache.find(o => o.hashedFilename === hashedFilename)
if (!hashEntry)  console.log('HASHER', hashedFilename + ' has no hash cached')
  return hashEntry ? hashEntry.filename : hashedFilename
}


// async function getHash(filename) {
//   let hash = cache.get(filename)
//   if (!hash) {
//     hash = await calcHash(filename)
//     cache.set(filename, hash)
//   }
//   return hash
// }


// async function setHash(filename) {
//   if (!cache.get(filename)) {
//     hash = await calcHash(filename)
//     cache.set(filename, hash)
//   }
// }


async function calcHash(filename, length = 6) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filename)
    const hash = crypto.createHash('sha1')
    hash.setEncoding('hex')
    stream.on('error', err => reject(err))
    stream.on('data', chunk => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex').substring(0, length)))
  })
}



module.exports = {
  hashFilename,
  unhashFilename,
    // cache,
  // getHash,
  // setHash,
  // calcHash,
}