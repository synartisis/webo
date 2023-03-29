import path from 'node:path'
import fs from 'node:fs/promises'
import * as parse5 from '../tools/parse5.js'
import { cachebust } from '../tools/cachebuster.js'
import { port } from '../../servers/webo-server.js'


/** @type {(source: string, filename: string, config: Webo.Config) => Promise<{ content: string, deps: Webo.FileDeps }>} */
export async function parse(source, filename, config) {

  let content = source

  if (config.watchClient) {
    content = source.replace('</body>', /*html*/`
      <script>
        var weboSocketScript = document.createElement('script');
        weboSocketScript.src = location.origin.replace(location.port, '${port}') + '/webo-socket.js';
        document.body.appendChild(weboSocketScript)
      </script>
    </body>`)
  }

  // include bracket imports  [[ ../_partial.html ]]
  const { contentWithPartials, partials } = await includeBracketPartials(content, filename)
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
    await cacheBusting(doc, filename, config, refs)
  }

  return { content: parse5.serialize(doc), deps: { ...partials, ...refs } }

}



/** @type {(source: string, filename: string) => Promise<{contentWithPartials: string, partials: any}>} */
async function includeBracketPartials(source, filename) {
  let contentWithPartials = source
  let match
  /** @type {any} */
  const partials = {}
  const re = /\[\[\s*import\s*(?<path>.*)\s*\]\]/g
  while (match = re.exec(contentWithPartials)) {
    const relPartialPath = match.groups?.path.trim() ?? ''
    const partialPath = path.join(path.dirname(filename), relPartialPath)
    partials[partialPath] = { type: 'dev-dep' }
    let partialContent = await fs.readFile(partialPath, 'utf-8')
    const partialDoc = parse5.parseFragment(partialContent)
    const partialDir = path.dirname(relPartialPath)
    partialContent = await rewritePartials(partialDoc, partialDir)
    const [ before, after ] = contentWithPartials.split(match[0])
    contentWithPartials = [ before, partialContent, after ].join('')
    // console.debug(match.groups.path, path.join(path.dirname(filename), match.groups.path))
  }
  return { contentWithPartials, partials }
}


/** @type {(doc: parse5.Node, dir: string) => Promise<Webo.FileDeps>} */
async function detectRefs(doc, dir) {
  /** @type {any} */
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


/** @type {(doc: parse5.Node, currentEnv: 'production' | 'development') => Promise<void>} */
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


/** @param {parse5.Node} doc */
async function createLegacyScripts(doc) {
  const scriptElements = parse5.qsa(doc, 
    el => el.name === 'script' && el.attribs['type'] === 'module' && 'src' in el.attribs && !el.attribs['src'].includes('.min.') && !el.attribs['src'].includes('//')
  )
  await Promise.all(
    scriptElements.map(el => {
      const src = el.attribs['src']
      const legacyScript = parse5.createElement('script', { src: src.replace(/\.(m?js)$/, '.legacy.$1'), nomodule: '', defer: '' })
      parse5.insertBefore(legacyScript, el)
    })
  )
  return scriptElements
}


/** @type {(doc: parse5.Node, filename: string, config: Webo.Config, htmlRefs: Webo.FileDeps) => Promise<void>} */
async function cacheBusting(doc, filename, config, htmlRefs) {
  const dir = path.dirname(filename)
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
      if (ref.includes('//')) return
      const ext = ref.split('.').pop()
      if (!ext) return
      const hash = await cachebust(path.join(dir, ref), config, { type, referrer: filename })
      let newRef = [ref.substring(0, ref.length - ext.length - 1), hash, ext].filter(Boolean).join('.')
      el.attribs[attr] = newRef
    })
  )
}


/** @type {(doc: parse5.Node, relPath: string) => Promise<string>} */
async function rewritePartials(doc, relPath) {
  const partialRefs = parse5.qsa(doc, el => [ 'script', 'link', 'img' ].includes(el.name))
  await Promise.all(
    partialRefs.map(async el => {
      if (el.name === 'script' && !el.attribs['src']) return
      if (el.name === 'link' && el.attribs['rel'] !== 'stylesheet' && !el.attribs['rel'].includes('icon')) return
      if (el.name === 'img' && !el.attribs['src']) return
      const attr = 'src' in el.attribs ? 'src' : 'href'
      const uri = el.attribs[attr]
      const ref = uri.split('?')[0]
      if (ref.startsWith('http://') || ref.startsWith('https://') || ref.startsWith('//')) return
      const refNew = path.join(relPath, ref)
      el.attribs[attr] = refNew
      // console.log(el.name, ref, attr, path.join(partialDir, ref))
    })
  )    
  return parse5.serialize(doc)
}