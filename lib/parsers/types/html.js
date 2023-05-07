import path from 'node:path'
import fs from 'node:fs/promises'
import * as html from 'syn-html-parser'
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

  const doc = content.includes('<!DOCTYPE html>') ? html.parseHtml(content) : html.parseFragment(content)

  await weboAttributes(doc, config.command === 'build' ? 'production' : 'development')

  if (config.legacy) {
    const scripts = await createLegacyScripts(doc)
    if (scripts.length > 0) {
      const weboEnvScript = html.createElement('script', { src: '/webo-env.min.js', nomodule: '' })
      html.insertBefore(weboEnvScript, scripts[0])
    }
  }

  const refs = await detectRefs(doc, path.dirname(filename))

  if (config.cachebust) {
    await cacheBusting(doc, filename, config, refs)
  }

  return { content: html.serialize(doc), deps: { ...partials, ...refs } }

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
    const partialDoc = html.parseFragment(partialContent)
    const partialDir = path.dirname(relPartialPath)
    partialContent = await rewritePartials(partialDoc, partialDir)
    const [ before, after ] = contentWithPartials.split(match[0])
    contentWithPartials = [ before, partialContent, after ].join('')
    // console.debug(match.groups.path, path.join(path.dirname(filename), match.groups.path))
  }
  return { contentWithPartials, partials }
}


/** @type {(doc: html.ParentNode, dir: string) => Promise<Webo.FileDeps>} */
async function detectRefs(doc, dir) {
  /** @type {any} */
  const refs = {}
  html.qsa(doc, el => {
    if (el.tagName === 'script') {
      const attribs = html.getAttributes(el)
      if (!attribs['src'] || attribs['src'].includes('//')) return false
      const src = attribs['src'].trim().split('?')[0]
      let type = 'js-script'
      if (attribs['nomodule']) type = 'js-legacy'
      if (attribs['type'] === 'module') type = 'js-module'
      if (src.includes('.min.')) type = 'raw'
      refs[path.join(dir, src)] = { type }
    }
    if (el.tagName === 'link') {
      const attribs = html.getAttributes(el)
      if (attribs['rel'] !== 'stylesheet' || !attribs['href'] || attribs['href'].includes('//')) return false
      refs[path.join(dir, attribs['href'].trim().split('?')[0])] = { type: 'css' }
    }
    return false
  })
  return refs
}


/** @type {(doc: html.ParentNode, currentEnv: 'production' | 'development') => Promise<void>} */
async function weboAttributes(doc, currentEnv) {
  const els = html.qsa(doc, el => !!html.getAttributes(el)['webo-env'])
  await Promise.all(
    els.map(el => {
      const attribs = html.getAttributes(el)
      if (attribs['webo-env'] !== currentEnv) {
        html.detachNode(el)
      } else {
        delete attribs['webo-env']
      }
    })
  )
}


/** @param {html.ParentNode} doc */
async function createLegacyScripts(doc) {
  const scriptElements = html.qsa(doc, el => {
    const attribs = html.getAttributes(el)
    return el.tagName === 'script' && attribs['type'] === 'module' && 'src' in attribs && !attribs['src']?.includes('.min.') && !attribs['src']?.includes('//')
  })
  scriptElements.map(el => {
    const attribs = html.getAttributes(el)
    const src = attribs['src']
    if (!src) return
    const legacyScript = html.createElement('script', { src: src.replace(/\.(m?js)$/, '.legacy.$1'), nomodule: '', defer: '' })
    html.insertBefore(legacyScript, el)
  })
  return scriptElements
}


/** @type {(doc: html.ParentNode, filename: string, config: Webo.Config, htmlRefs: Webo.FileDeps) => Promise<void>} */
async function cacheBusting(doc, filename, config, htmlRefs) {
  const dir = path.dirname(filename)
  const refs = html.qsa(doc, el => [ 'script', 'link', 'img' ].includes(el.tagName))
  await Promise.all(
    refs.map(async el => {
      const attribs = html.getAttributes(el)
      if (el.tagName === 'script' && !attribs['src']) return
      if (el.tagName === 'link' && attribs['rel'] !== 'stylesheet' && !attribs['rel']?.includes('icon')) return
      if (el.tagName === 'img' && !attribs['src']) return
      const attr = 'src' in attribs ? 'src' : 'href'
      const uri = attribs[attr]
      if (!uri) throw new Error(`cacheBusting error`)
      const ref = uri.split('?')[0]
      if (ref.startsWith('http://') || ref.startsWith('https://') || ref.startsWith('//')) return
      const refPath = path.join(dir, ref)
      const { type } = htmlRefs[refPath] || {}
      if (ref.includes('//')) return
      const ext = ref.split('.').pop()
      if (!ext) return
      const hash = await cachebust(path.join(dir, ref), config, { type, referrer: filename })
      let newRef = [ref.substring(0, ref.length - ext.length - 1), hash, ext].filter(Boolean).join('.')
      const refAttr = el.attrs.find(o => o.name === attr)
      if (refAttr) {
        refAttr.value = newRef
      }
    })
  )
}


/** @type {(doc: html.ParentNode, relPath: string) => Promise<string>} */
async function rewritePartials(doc, relPath) {
  const partialRefs = html.qsa(doc, el => [ 'script', 'link', 'img' ].includes(el.tagName))
  await Promise.all(
    partialRefs.map(async el => {
      const attribs = html.getAttributes(el)
      if (el.tagName === 'script' && !attribs['src']) return
      if (el.tagName === 'link' && attribs['rel'] !== 'stylesheet' && !attribs['rel']?.includes('icon')) return
      if (el.tagName === 'img' && !attribs['src']) return
      const attr = 'src' in attribs ? 'src' : 'href'
      const uri = attribs[attr]
      if (!uri) throw new Error(`rewritePartials error`)
      const ref = uri.split('?')[0]
      if (ref.startsWith('http://') || ref.startsWith('https://') || ref.startsWith('//')) return
      const refNew = path.join(relPath, ref)
      const refAttr = el.attrs.find(o => o.name === attr)
      if (refAttr) {
        refAttr.value = refNew
      }
      // console.log(el.name, ref, attr, path.join(partialDir, ref))
    })
  )    
  return html.serialize(doc)
}