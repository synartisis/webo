// @ts-nocheck
import fs from 'node:fs'
import fsPromises from 'node:fs/promises'
import { Readable } from 'node:stream'
import { parsable } from '../../webo-settings.js'

fs.createReadStream_ORIG = fs.createReadStream.bind(fs)
fs.createReadStream = function createReadStreamWebo(path, options = {}) {
  if (!parsable(path)) return fs.createReadStream_ORIG(path, options)
  // console.log('CALLING createReadStream', path)
  const s1 = new Readable()
  s1._read = async function() {
    try {
      const buffer = await loadFile(path)
      this.push(buffer)
      this.push(null)
    } catch (error) {
      this.push(null)
    }
  }
  return s1
}

fs.readFile_ORIG = fs.readFile.bind(fs)
fs.readFile = async function readFileWebo(path, options, callback) {
  if (!parsable(path)) return fs.readFile_ORIG(path, options, callback)
  // console.log('CALLING readFile', path)
  callback = callback || options
  try {
    const buffer = await loadFile(path)
    return callback(null, buffer)
  } catch (error) {
    return callback(error)
  }
} 

fsPromises.readFile_ORIG = fsPromises.readFile.bind(fsPromises)
fsPromises.readFile = async function readFilePromisesWebo(path, options) {
  if (!parsable(path)) return fsPromises.readFile_ORIG(path, options)
  // console.log('CALLING readFile PROMISES', path, { options})
  try {
    const buffer = await loadFile(path)
    if (typeof options === 'string' || typeof options.encoding === 'string') {
      return buffer.toString(options.encoding || options)
    }
    return buffer
  } catch (error) {
    throw error
  }
} 

fs.stat_ORIG = fs.stat.bind(fs)
fs.stat = function statWebo(path, cb) {
  if (!parsable(path)) return fs.stat_ORIG(path, cb)
  // console.log('CALLING stat', path)
  fs.stat_ORIG(path, async (err, stat) => {
    if (err) stat = Object.assign(new fs.Stats(), statDefaults)
    try {
      const buffer = await loadFile(path)
      cb(null, Object.assign(stat, { size: buffer.byteLength }))
    } catch (error) {
      cb(err)
    }
  })

}

fsPromises.stat_ORIG = fsPromises.stat.bind(fsPromises)
fsPromises.stat = async function statPromisesWebo(path) {
  if (!parsable(path)) return fsPromises.stat_ORIG(path)
  // console.log('CALLING stat PROMISES', path)
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stat) => {
      if (err) return reject(err)
      return resolve(stat)
    })
  })
}

const statDefaults = {
  mode: 33188,
  nlink: 1,
  uid: 0,
  gid: 0,
  redv: 0,
  atimeMs: 0,
  mtimeMs: 0,
  ctimeMs: 0,
  birthtimeMs: 0,
  atime: new Date('1970-01-01T00:00:00.000Z'),
  mtime: new Date('1970-01-01T00:00:00.000Z'),
  ctime: new Date('1970-01-01T00:00:00.000Z'),
  birthtime: new Date('1970-01-01T00:00:00.000Z'),
  isFile() { return true },
  isDirectory() { return false },
}


const pending = {}
async function loadFile(path) {
  if (cache[path] && cache[path].exp > Date.now()) {
    const b = Buffer.from(cache[path].content)
    delete cache[path]
    return b
  }
  const id = Math.floor(Math.random() * 10 ** 10)
  return new Promise((resolve, reject) => {
    pending[id] = { resolve, reject }
    process.send({ id, path })
  })
}

process.on('message', message => {
  const { id, path, content } = message
  const { resolve, reject } = pending[id]
  delete pending[id]
  if (content !== undefined) {
    cache[path] = { content, exp: Date.now() + 300 }
    resolve(Buffer.from(content))
  } else {
    reject()
  }
})

const cache = {}