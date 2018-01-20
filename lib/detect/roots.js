const path = require('path')

module.exports = async function detectRoots(mode, type, entry) {

  let staticRoots = []
  let serverRoot = null
  if (type === 'static') {
    staticRoots = [ entry ]
  }
  if (type === 'express') {
    try {
      staticRoots = require('../servers/express.js')(entry)
    } catch (error) {
      console.log(`error loading ${entry}`)
      process.exit(1)
    }
    serverRoot = path.posix.dirname(entry)
  }

  const srcRoot = commonStringStart([ entry, ...staticRoots ])
  
  return { srcRoot, staticRoots, serverRoot }

}



function commonStringStart(stringArray){
  const a = stringArray.concat().sort()
  let a1 = a[0]
  let a2 = a[a.length-1]
  let i = 0
  while (i < a1.length && a1.charAt(i)=== a2.charAt(i)) i++;
  return a1.substring(0, i)
}