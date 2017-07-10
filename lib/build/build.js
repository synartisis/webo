const path = require('path')
const fs = require('fs')
const sh = require('shelljs')

const { state } = require('../state')
const parsers = require('../parsers')


module.exports = async () => {

  // console.log(state.deps)

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
        const content = await parsers.load(filename, 'prod')
        // const content = await loader(src + '/' + filename, 'prod')
        let cpErr = null
        if (content && ['html', 'css', 'js'].includes(ext)) {
          fs.writeFileSync(destFilename, content)
        } else {
          const cpRes = sh.cp(filename, destFilename)
          if (cpRes.stderr) cpErr = `Cannot find ${filename} referenced by ${state.deps.find(o => o.path === filename).ref}`
        }
        if (cpErr) console.error(cpErr)

        
        // console.log('copy', filename, destFilename, await hash(filename))
      } catch (error) {
        console.log('%%', filename, src, error.message)
      }
    })
  )

  if (state.express) {
    const serverRoot = path.dirname(state.express)
    sh.cp('-R', serverRoot, path.join(dest, path.relative(src,  serverRoot)))
    sh.cp('package.json', dest)
  }

}
