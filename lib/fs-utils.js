const path = require('path')
const { readdir, stat } = require('fs').promises
const fs = require('fs')


exports.readdirp = async function readdirp(dir, { type, includes, excludes } = {}) {
  if (includes) includes = [].concat(includes)
  if (excludes) excludes = [].concat(excludes)

  if (!dir.endsWith(path.sep)) dir += path.sep
  const entries = await readdir(dir, { withFileTypes: true })
  let files = []
  if (test(dir, includes, excludes)) files.push(dir)
  files
    .push(...
      await Promise.all(
        entries
          .map(async entry => {
            const entryPath = path.resolve(dir, entry.name)
            return entry.isDirectory() && !mustExclude(entryPath, excludes) ? readdirp(entryPath, { type, includes, excludes }) : entryPath
          })
      )
    )
  return files.filter(o => test(o, includes, excludes)).reduce((flat, fileOrArray) => flat.concat(fileOrArray), [])
    .filter(file => (!type || (type === 'dir') === file.endsWith(path.sep)) && (test(file, includes, excludes)))
}
function mustInclude(s, includes) { return !includes || includes.some(m => m.test(s)) }
function mustExclude(s, excludes) { return !!(excludes && excludes.some(m => m.test(s))) }
function test(s, includes, excludes) { return mustInclude(s, includes) && !mustExclude(s, excludes) }


const _watchingDirs = []
exports.watchDirs = function watchDirs(dirnames, listener) {
  if (!dirnames) return
  dirnames.forEach(dirname => {
    if (_watchingDirs.includes(dirname)) return
    _watchingDirs.push(dirname)
    let lastrun = Date.now()
    fs.watch(dirname, (eventType, filename) => {
      const now = Date.now()
      if (now < lastrun + 300) return;
      lastrun = now
      const filepath = dirname + filename
      setTimeout(() => 
        fs.stat(filepath, (err, stat) => {
          // check if modified in the last 3 seconds
          if (err) {
            if (err.code === 'ENOENT') {
              return listener('remove', filepath)
            } else {
              throw new Error(err)
            }
          }
          if (stat.mtimeMs < now - 3 * 1000) return
          if (stat.isFile()) {
            return listener('change', filepath)
          } else {
            const dirpath = filepath.endsWith(path.sep) ? filepath : filepath + path.sep
            // console.log('DIR', {filepath, dirpath, eventType, filename})
            watchDirs([ dirpath ], listener)
          }
        })
      , 100)
    })
  })
}
