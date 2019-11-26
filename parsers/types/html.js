const path = require('path')
const { readFile } = require('fs').promises
const parse5 = require('../utils/parse5.js')
// const { calcHash } = require('../../lib/utils.js')
const { cachebust } = require('../utils/cachebuster.js')

exports.parse = async function parse(source, filename, config) {

  let content = source
  let deps = {}

  if (config.watchClient) {
    const { port } = require('../../servers/webo-server.js')
    content = source.replace('</body>', `<script src="//localhost:${port}/webo-socket.js"></script>\n</body>`)
  }

  const { contentWithPartials, partials } = await includePartials(content, filename)
  if (Object.keys(partials).length) {
    content = contentWithPartials
  }

  const doc = parse5.parseHtml(content)

  await weboAttributes(doc, config.command === 'build' ? 'production' : 'development')

  if (config.legacy) {
    const scripts = await createLegacyScripts(doc)
    if (scripts.length > 0) {
      const weboEnvScript = parse5.createElement('script', { src: '/webo-env.min.js', nomodule: '' })
      parse5.insertBefore(weboEnvScript, scripts[0])
    }
  }

  const refs = await detectRefs(doc, path.dirname(filename))

  if (config.cachebust) {
    if (!filename.replace(/\\/g, '/').split('/').pop().startsWith('_')) {
      await cacheBusting(doc, path.dirname(filename), config, refs)
    }
  }

  return { content: parse5.serialize(doc), deps: { ...partials, ...refs } }

}



async function includePartials(source, filename) {
  let contentWithPartials = source
  let match
  const partials = {}
  const re = /\[\[\s*import\s*(?<path>.*)\s*\]\]/g
  while (match = re.exec(contentWithPartials)) {
    const relPartialPath = match.groups.path && match.groups.path.trim()
    // console.log(match)
    const partialPath = path.join(path.dirname(filename), relPartialPath)
    partials[partialPath] = { type: 'dev-dep' }
    const partialContent = (await readFile(partialPath)).toString()
    const [ before, after ] = contentWithPartials.split(match[0])
    contentWithPartials = [ before, partialContent, after ].join('')
    // console.log(match.groups.path, path.join(path.dirname(filename), match.groups.path))
  }
  return { contentWithPartials, partials }
}


async function detectRefs(doc, dir) {
  const refs = {}
  await parse5.walk(doc, el => {
    if (el.name === 'script' && 'src' in el.attribs && !el.attribs['src'].includes('//')) {
      const src = el.attribs['src'].trim().split('?')[0]
      let type = 'js-script'
      if ('nomodule' in el.attribs) type = 'js-legacy'
      if (el.attribs['type'] === 'module') type = 'js-module'
      if (src.includes('.min.')) type = 'raw'
      refs[path.join(dir, src)] = { type }
    }
    if (el.name === 'link' && el.attribs['rel'] === 'stylesheet' && !el.attribs['href'].includes('//')) refs[path.join(dir, el.attribs['href'].trim().split('?')[0])] = { type: 'css' }
  })
  return refs
}


async function weboAttributes(doc, currentEnv) {
  const els = parse5.qsa(doc, el => el.attribs && 'webo-env' in el.attribs)
  await Promise.all(
    els.map(el => {
      if (el.attribs['webo-env'] !== currentEnv) {
        parse5.remove(el)
      } else {
        delete el.attribs['webo-env']
      }
    })
  )
}


async function createLegacyScripts(doc) {
  const scripts = parse5.qsa(doc, el => el.name === 'script' && el.attribs['type'] === 'module' && 'src' in el.attribs && !el.attribs['src'].includes('.min.') && !el.attribs['src'].includes('//'))
  await Promise.all(
    scripts.map(el => {
      const src = el.attribs['src']
      const legacyScript = parse5.createElement('script', { src: src.replace(/\.(m?js)$/, '.legacy.$1'), nomodule: '', defer: '' })
      parse5.insertBefore(legacyScript, el)
    })
  )
  return scripts
}



async function cacheBusting(doc, dir, config, htmlRefs) {
  const refs = parse5.qsa(doc, el => [ 'script', 'link', 'img' ].includes(el.name))
  await Promise.all(
    refs.map(async el => {
      if (el.name === 'script' && !el.attribs['src']) return
      if (el.name === 'link' && el.attribs['rel'] !== 'stylesheet' && !el.attribs['rel'].includes('icon')) return
      if (el.name === 'img' && !el.attribs['src']) return
      const attr = 'src' in el.attribs ? 'src' : 'href'
      const uri = el.attribs[attr]
      const ref = uri.split('?')[0]
      if (ref.startsWith('http://') || ref.startsWith('https://') || ref.startsWith('//')) return
      const refPath = path.join(dir, ref)
      const { type } = htmlRefs[refPath] || {}
      if (ref.includes('//') || ref.includes('//')) return
      const ext = ref.split('.').pop()
      let newRef = ref.substring(0, ref.length - ext.length - 1) + '.' + await cachebust(path.join(dir, ref), config, { type }) + '.' + ext
      el.attribs[attr] = newRef
    })
  )
}