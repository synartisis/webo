const path = require('path')
const postcss = require('postcss')
const postcssUrl = require("postcss-url")
const postcssImport = require("postcss-import")
const uglify = require('uglify-es')
const { readFileAsync, calcAssetPath, logv } = require('../../utils/utils.js')

module.exports = {

  async load() {

    const content = (await this.loadSource()).toString()
    const deps = []
  
    const { hash } = this.options.parserOptions
    const { getHash } = this.options
    
    const dirname = path.dirname(this.filename)
    const filename = this.filename

    const attachFile = this.attachFile
  
    let { css } = await postcss()
      .use( postcssImport({ path: dirname }) )
      .use( postcssUrl({
        url({ url }) {
          if (!url.startsWith('http:') && !url.startsWith('https:')) {
            const assetPath = calcAssetPath(filename, url)
            // deps.push({ filename: assetPath })
            const dep = attachFile(assetPath)
            deps.push(dep)
            // if (hash) {
            //   await dep.load()
            //   const depHash = await dep.getHash()
            //   console.log(assetPath, depHash)
      
            //   const ending = '.' + url.split('.').pop()
            //   // console.log('*1', this.filename, url)
            //   url = url.replace(ending, '-' + depHash + ending)
            //   // console.log('*2', this.filename, url)
            // }
          }
          return url
        }
      }) )
      .process(content)
    
    if (hash) {
      await Promise.all(deps.map(async dep => { await dep.parse(); }))
      css = await postcss().use( postcssUrl({
        url({ url }) {
          const assetPath = calcAssetPath(filename, url)
          const dep = deps.find(o => o.filename === assetPath)
          const ending = '.' + url.split('.').pop()
          url = url.replace(ending, '-' + dep.hash + ending)
          return url
        }
      }) ).process(css).css
    }

    // console.log('**', filename, deps)

    this.content = css
    this.deps = deps
    // return { content: css, deps }
  }

}

