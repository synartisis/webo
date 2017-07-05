const path = require('path')
const fs = require('fs')
const sh = require('shelljs')

const { state } = require('../state')
const loader = require('../loaders/loader')


module.exports = async () => {

  // const src = path.resolve(state.config.srcRoot)
  // const dest = path.resolve(state.config.destRoot)
  const src = state.config.srcRoot
  const dest = state.config.destRoot

  let files = []
  files.push(... state.entries.filter(o => o !== state.config.layout))
  files.push(... state.deps.filter(o => {
    const ext = o.path.split('.').pop()
    // if (o.path.startsWith('http')) return false
    if (!state.proc.bundle) return true
    if (!['css', 'js'].includes(ext)) return true
    if (o.ref.endsWith('.html')) return true
    return false
  }).map(o => o.path))
    
  // console.log('****', files)
  sh.rm('-rf', dest)
  
  await Promise.all(
    files.map(async filename => {
      try {
        const ext = filename.split('.').pop()
        // console.log('**', filename)
        // if (filename.startsWith('http')) return
        // const destFilename = path.join(dest, filename)
        const destFilename = path.join(dest, path.relative(src,  filename))
        // console.log('**DEST', destFilename)
        // return

        sh.mkdir('-p', path.dirname(destFilename))
        const content = await loader(filename, 'prod')
        // const content = await loader(src + '/' + filename, 'prod')
        if (content && ['html', 'css', 'js'].includes(ext)) {
          fs.writeFileSync(destFilename, content)
        } else {
          sh.cp(filename, destFilename)
        }
        console.log('copy', filename, destFilename)
      } catch (error) {
        console.log(filename, src, error)
      }
    })
  )

}
