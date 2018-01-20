const path = require('path')
const { globAsync } = require('../../../utils/utils.js')
const { JSDOM } = require('jsdom')
const { htmlDeps, readFileAsync } = require('../utils/helpers.js')


module.exports.applyIncludes = async function applyIncludes(filename, content, srcRoot) {
  let result = await applyLayout(filename, content, srcRoot)
  result.content = await applyPartials(filename, result.content)
  return result
}


async function applyLayout(filename, content, srcRoot) {
  let result = { content, layoutPath: null }
  if (content.includes('<html ')) return result // apply layout only to partial pages
  if (filename.split('/').pop().startsWith('_')) return result
  const { layoutContent, layoutPath } = await getLayout(srcRoot)
  if (!layoutContent) return result

  const mainMatch = String(layoutContent).match(/(\[\[.*main.*\]\])/i)
  if (!mainMatch || mainMatch.length < 2) return result

  const { JSDOM } = require('jsdom')
  const domLayout = new JSDOM(layoutContent)
  let layoutRelPath = path.posix.relative(path.dirname(filename), path.dirname(layoutPath))

  if (layoutRelPath) {
    const layoutDeps = htmlDeps(domLayout.window.document, true)
    layoutDeps.forEach(el => {
      let attr = el['href'] ? 'href' : 'src'
      el[attr] = (layoutRelPath + ( layoutRelPath && !layoutRelPath.endsWith('/') && !el[attr].startsWith('/') ? '/' : '' ) + el[attr].replace('about:blank', '')).replace('/#', '#')
      if (el[attr].endsWith('//')) el[attr] = el[attr].substring(0, el[attr].length - 2) // HACK
    })
  }
  return { content: domLayout.serialize().replace(mainMatch[1], content), layoutPath }
}


async function getLayout(srcRoot) {
  let layoutContent
  let layoutPath = (await globAsync(srcRoot + '**/_layout.html', { cwd: '.', nodir: true }))[0]
  if (layoutPath) layoutContent = await readFileAsync(layoutPath, 'utf8')
  return { layoutContent, layoutPath }
}


async function applyPartials(filename, content) {
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
        el[attr] = relPath + ( relPath && !relPath.endsWith('/') && !el[attr].startsWith('/') ? '/' : '' ) + el[attr].replace('about:blank', '')
      })
      content = content.replace(partial, domPartial.serialize())
    })
  )
  return content
}
