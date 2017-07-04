const { JSDOM } = require('jsdom')
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const cssResolver = require('./css')
const jsResolver = require('./js')
const { createDep } = require('./dep')

module.exports = async filename => {
  try {
    filename = path.resolve(filename)
    const content = await promisify(fs.readFile)(filename, 'utf8')
  
    const dom = new JSDOM(content)
    const document = dom.window.document
  
    let assets = [
      ...[... document.querySelectorAll('script[src]:not([type="module"])')].filter(o => !o.src.startsWith('http')).map(o => createDep(filename, o.src, 'script', filename)),
      ...[... document.querySelectorAll('script[src][type="module"]')].filter(o => !o.src.startsWith('http')).map(o => createDep(filename, o.src, 'module', filename)),
      ...[... document.querySelectorAll('link[rel="stylesheet"]')].filter(o => !o.href.startsWith('http')).map(o => createDep(filename, o.href, 'css', filename)),
      ...[... document.querySelectorAll('img[src]')].filter(o => !o.src.startsWith('http')).map(o => createDep(filename, o.src, 'img', filename)),
    ]
  
    let css = await Promise.all(assets.filter(o => o.type === 'css').map(o => cssResolver(o.path, filename)))
    css.map(o => assets.push(... o))
  
    let js = await Promise.all(assets.filter(o => o.type === 'script' || o.type === 'module').map(o => jsResolver(o.path, filename, { type: o.type })))
    js.map(o => assets.push(... o))
    
    // console.log(assets)
    return assets
  } catch (error) {
    console.error(`Error parsing ${filename} - ${error}`)
    return []
  }
}


//   // out proc
// if (require.main === module) {
//   ;(async () => {
//     const [ , , entry ] = process.argv
//     const assets = await module.exports(entry)
//     console.log(JSON.stringify(assets))
//   })()
// }