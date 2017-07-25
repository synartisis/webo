const path = require('path')
const { JSDOM } = require('jsdom')

const { hashFilename } = require('./hasher')
const utils = require('../utils')



module.exports = async function(content, options) {
  const { resolvePath } = require('../utils')
  const { mode, filename, bundle, layout, hash } = options
  

  if (layout) content = await applyLayout(content, layout, filename)
  content = await applyPartials(content, filename)
  
  const dom = new JSDOM(content)
  let document = dom.window.document
  // await applyWeboTags(document, filename, layout)
  // console.log('**', filename, document.head.innerHTML, document.body.children.length, document.head.innerHTML !== '')
  
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
      const hashRel = await hashFilename(resolvePath(filename, el[attr]))
      el[attr] = el[attr].split('.').map((o, i, c) => i === c.length - 2 ? o + '-' + hashRel : o).join('.')
      // el[attr] = await hashFilename(resolvePath(filename, el[attr]))
      // const hash = await getHash(filename)
      // el[attr] = injectHash(el[attr], hash)
    }
    return asset
  }))
  return { content: dom.serialize(), assets }
}





// async function applyWeboTags(document, filename, layout) {
//   const isPartial = document.head.innerHTML === ''
//   if (isPartial && document.body.children.length > 1) utils.error('Partial pages must have one root element - ' + filename)
//   if (isPartial) {
//     const layoutPath = document.body.weboLayout || layout
//     const layoutSlotName = document.body.weboSlot || 'main'
//     const { readFileAsync } = require('../utils')
//     const layoutContent = await readFileAsync(layout, 'utf8')
//     const domLayout = new JSDOM(layoutContent)
//     let layoutRelPath = path.posix.relative(path.dirname(filename), path.dirname(layoutPath))
//     layoutRelPath ? layoutRelPath += '/' : layoutRelPath = ''
//     const layoutDeps = htmlDeps(domLayout.window.document, true)
//     layoutDeps.forEach(el => {
//       let attr = el['href'] ? 'href' : 'src'
//       el[attr] = layoutRelPath + el[attr].replace('about:blank', '')
//     })
//     const layoutSlot = domLayout.window.document.querySelector(`webo-slot[name="${layoutSlotName}"]`)
//     if (layoutSlot) {
//       layoutSlot.outerHTML = document.body.innerHTML
//       document.documentElement.innerHTML = domLayout.window.document.documentElement.innerHTML
//       // document.head.innerHTML = domLayout.window.document.head.innerHTML
//       // document.body.innerHTML = domLayout.window.document.body.innerHTML
//     }
//   }
//   let weboLayout = [...document.querySelectorAll('[webo-layout]')]
//   if (weboLayout.length > 1) throw `File ${filename} has more than one webo-layout attributes`
//   // console.log(document.body.)
// }


async function applyLayout(content, layout, filename) {
  const { readFileAsync } = require('../utils')
  if (layout === filename) return content
  const layoutContent = await readFileAsync(layout, 'utf8')
  const mainMatch = String(layoutContent).match(/(\[\[.*main.*\]\])/i)
  if (!mainMatch || mainMatch.length < 2) return content

  const domLayout = new JSDOM(layoutContent)
  let layoutRelPath = path.relative(path.dirname(filename), path.dirname(layout))
  // layoutRelPath ? layoutRelPath += '/' : layoutRelPath = ''
  const layoutDeps = htmlDeps(domLayout.window.document, true)
  layoutDeps.forEach(el => {
    let attr = el['href'] ? 'href' : 'src'
    el[attr] = layoutRelPath + ( !layoutRelPath.endsWith('/') && !el[attr].startsWith('/') ? '/' : '' ) + el[attr].replace('about:blank', '')
    // console.log('***', filename, layout, layoutRelPath, layoutRelPath + el[attr])
    if (el[attr].endsWith('//')) el[attr] = el[attr].substring(0, el[attr].length - 2) // HACK
  })
  return domLayout.serialize().replace(mainMatch[1], content)
  // return domLayout.serialize().replace('{{{ body }}}', content)
}


async function applyPartials(content, filename) {
  const { readFileAsync } = require('../utils')
  const partials = String(content).match(/(\[\[.*import.*\]\])/ig)
  // console.log(filename, '===')
  if (!partials || !partials.length) return content
  await Promise.all(
    partials.map(async partial => {
      let partialFilename = path.dirname(filename) + '/' + partial.replace('[[', '').replace(']]', '').replace('import', '').trim()
      let relPath = path.relative(path.dirname(filename), path.dirname(partialFilename))
      // console.log('**', partialFilename, filename, relPath)
      const partialContent = await readFileAsync(partialFilename, 'utf8')
      const domPartial = new JSDOM(partialContent)
      const partialDeps = htmlDeps(domPartial.window.document, true)
      partialDeps.forEach(el => {
        let attr = el['href'] ? 'href' : 'src'
        el[attr] = relPath + ( !relPath.endsWith('/') && !el[attr].startsWith('/') ? '/' : '' ) + el[attr].replace('about:blank', '')
      })
      content = content.replace(partial, domPartial.serialize())
    })
  )
  return content
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
