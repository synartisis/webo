const path = require('path')
const { globAsync, readFileAsync } = require('../../utils/utils.js')


module.exports.applyLayout = async function applyLayout(filename, content, srcRoot) {
  let result = { content, layoutPath: null }
  if (filename.split('/').pop().startsWith('_')) return result
  const { layoutContent, layoutPath } = await getLayout(srcRoot)
  if (!layoutContent) return result

  const mainMatch = String(layoutContent).match(/(\[\[.*main.*\]\])/i)
  if (!mainMatch || mainMatch.length < 2) return result

  const { JSDOM } = require('jsdom')
  const domLayout = new JSDOM(layoutContent)
  let layoutRelPath = path.posix.relative(path.dirname(filename), path.dirname(layoutPath))

  if (layoutRelPath) {
    const { htmlDeps } = require('./parse-helpers.js')
    const layoutDeps = htmlDeps(domLayout.window.document, true)
    layoutDeps.forEach(el => {
      let attr = el['href'] ? 'href' : 'src'
      el[attr] = (layoutRelPath + ( layoutRelPath && !layoutRelPath.endsWith('/') && !el[attr].startsWith('/') ? '/' : '' ) + el[attr].replace('about:blank', '')).replace('/#', '#')
      // console.log('***', filename, layout, layoutRelPath, layoutRelPath + el[attr])
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
