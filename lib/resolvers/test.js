const glob = require('glob')
const cp = require('child_process')
const { promisify } = require('util')
const exec = promisify(cp.exec)

const [ , , include] = process.argv


;(async () => {
  
  console.log(new Date().toISOString().split('T')[1])
  const entries = glob.sync(include, { nodir: true, ignore: ['node_modules/**', 'dist/**'] })

  let deps = []
  await Promise.all(
    entries.map(async entry => {
      const ext = entry.split('.').pop()
      if (['html', 'css', 'js'].includes(ext)) {
        const entryDeps = await require('./' + ext)(entry, entry, { type: 'module' })
        deps.push(... entryDeps)
      }
    })
  )
  console.log(deps)
  
  // const all = await Promise.all(
  //   entries.map(entry => 
  //     exec('node ' + __dirname + '/' + entry.split('.').pop() + ' ' + require('path').join(require('path').resolve('.'), entry))
  //     .then(out => JSON.parse(out.stdout))
  //   )
  // )
  // console.log(all.reduce((all, o) => all.push(...o) && all, []))

  console.log(new Date().toISOString().split('T')[1])
  

})()