const fs = require('fs')
const crypto = require('crypto')


module.exports = async (filename, length = 6) => {

  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filename)
    const hash = crypto.createHash('sha1')
    hash.setEncoding('hex')
    stream.on('error', err => reject(err))
    stream.on('data', chunk => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex').substring(0, length)))
  })

}