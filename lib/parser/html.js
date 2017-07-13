const path = require('path')
const { JSDOM } = require('jsdom')

const { readFileAsync, calcHash, injectHash, resolvePath } = require('../utils')
const { hashFilename } = require('./hasher')



module.exports = async function(content, options) {
  const { mode, filename, bundle, layout, hash } = options
  

  if (layout) content = await applyLayout(content, layout, filename)
    
  const dom = new JSDOM(content)
  const document = dom.window.document
  
  if (mode === 'dev') {
    const weboSocket = document.createElement('script')
    weboSocket.src = '/webo/webo-socket.js'
    document.body.appendChild(weboSocket)
  }
  
  if (bundle) {
    const scripts = [...document.querySelectorAll('script')]
    scripts.forEach(script => script.removeAttribute('type'))
  }

  const elements = htmlDeps(document)
  const assets = await Promise.all(elements.map(async el => {
    const attr = el['href'] ? 'href' : 'src'
    const asset = {
      ref: filename,
      rel: el[attr],
      type: el.type === 'module' ? 'module' : null,
    }
    if (hash) {
      el[attr] = await hashFilename(resolvePath(filename, el[attr]))
      // const hash = await getHash(filename)
      // el[attr] = injectHash(el[attr], hash)
    }
    return asset
  }))
  return { content: dom.serialize(), assets }
}



// async function applyHash(el, filename, rel) {
//   const depPath = path.relative('.' , path.resolve(path.dirname(filename), rel.split('?')[0])).replace(/\\/g, '/')
//   const hash = await getHash(depPath)
//   if (!hash) return false
//   const { state } = require('../state')
//   const attr = el['href'] ? 'href' : 'src'
//   const parts = el[attr].split('.')
//   const dep = state.deps.find(o => o.rel === el[attr])
//   if (dep && parts.length > 1) {
//     parts[parts.length - 2] = parts[parts.length - 2] + '-' + hash
//     el[attr] = parts.join('.')
//   }
//   return true
// }


// module.exports.load = async function load(content, options) {
//   const { mode, filename, bundle, hash, layout } = options
//   if (!content) return content

// // console.log(layout, filename)
//   if (layout) content = await applyLayout(content, layout, filename, hash)

//   const dom = new JSDOM(content)
//   const document = dom.window.document


//   if (mode === 'dev') {
//     const weboSocket = document.createElement('script')
//     weboSocket.src = '/webo/webo-socket.js'
//     document.body.appendChild(weboSocket)
//   }

//   if (bundle) {
//     const scripts = [...document.querySelectorAll('script')]
//     scripts.forEach(script => script.removeAttribute('type'))
//   }

//   if (hash) {
//     const { state } = require('../state')
//     const elements = htmlDeps(document)
//     elements.forEach(el => {
//       const attr = el['href'] ? 'href' : 'src'
//       const parts = el[attr].split('.')
//       const dep = state.deps.find(o => o.rel === el[attr])
//       if (dep && dep.hash && parts.length > 1) {
//         parts[parts.length - 2] = parts[parts.length - 2] + '-' + dep.hash
//         el[attr] = parts.join('.')
//       }
//     })
//   }


//   return dom.serialize()
// }




// module.exports.resolveDeps = async function resolveDeps(content, options) {
//   const { filename, layout, hash } = options
//   const { createDep } = require('../state')

//   const dom = new JSDOM(content)
//   const document = dom.window.document

//   if (layout) content = await applyLayout(content, layout, filename, hash)

//   const elements = htmlDeps(document)
//   // console.log(filename, htmlDeps(document).map(o => o.href || o.src))

//   let assets = []
//   await Promise.all(
//     elements.map(async el => {
//       const rel = el['href'] || el['src']
//       if (!rel) return
//       const ext = rel.split('.').pop()
//       let type = null
//       if (ext === 'js') type = el.type || 'script'
//       if (ext === 'css') type = 'css'
//       if (['png', 'jpg'].includes(ext)) type = 'img'
//       if (!type) type = ext
//       const dep = await createDep(filename, rel, type, filename)
//       if (dep) assets.push(dep)
//         // console.log(filename, dep.path)
//     })
//   )

//   let css = await Promise.all(assets.filter(o => o.type === 'css').map(o => parsers.css.resolveDeps(o.path, { root: filename })))
//   css.map(o => assets.push(... o))

//   let js = await Promise.all(assets.filter(o => o.type === 'script' || o.type === 'module').map(o => parsers.js.resolveDeps(o.path, { root: filename, type: o.type })))
//   js.map(o => assets.push(... o))
  
//   // if (hash) {
//   //   await Promise.all(assets.map(async o => {
//   //     o.hash = await calcHash(o.path)
//   //     // const relParts = o.rel.split('.')
//   //     // if (relParts.length > 1) {
//   //     //   relParts[relParts.length - 2] += '-' + o.hash
//   //     //   o.rel = relParts.join('.')
//   //     // }
//   //   }))
//   // }

//   // console.log(filename, assets)
//   return assets
//   // } catch (error) {
//   //   console.error(`Error parsing ${filename} - ${error.message}`)
//   //   return []
//   // }
// }





async function applyLayout(content, layout, filename) {
  if (layout === filename) return content
  const layoutContent = await readFileAsync(layout)
  const domLayout = new JSDOM(layoutContent)

  let layoutRelPath = path.relative(path.dirname(filename), path.dirname(layout))
  layoutRelPath ? layoutRelPath += '/' : layoutRelPath = ''
  const layoutDeps = htmlDeps(domLayout.window.document, true)
  layoutDeps.forEach(el => {
    let attr = el['href'] ? 'href' : 'src'
    el[attr] = layoutRelPath + el[attr].replace('about:blank', '').replace('//', '/')
    el[attr] = el[attr].replace('about:blank', '').replace('//', '/')
  })
  return domLayout.serialize().replace('{{{ body }}}', content)
}



function htmlDeps(document, includeHtmlLinks = false) {
  const deps = [
    ...[... document.querySelectorAll('script[src]:not([type="module"])')],
    ...[... document.querySelectorAll('script[src][type="module"]')],
    ...[... document.querySelectorAll('link[rel="stylesheet"]')],
    ...[... document.querySelectorAll('link[rel="icon"]')],
    ...[... document.querySelectorAll('img[src]')],
    ...[... document.querySelectorAll('a[href$=".pdf"]')],
  ].filter(el => el.href ? !el.href.startsWith('http:') && !el.href.startsWith('https:') : !el.src.startsWith('http:') && !el.src.startsWith('https:') && !el.src.startsWith('/webo/'))
  if (includeHtmlLinks) deps.push(...[... document.querySelectorAll('a[href]')])
  return deps
}
