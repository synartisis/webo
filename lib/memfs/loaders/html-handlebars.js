module.exports = function(options) {

  if (this.source.includes('<html ')) return // if page has html tag, ignore layout
  this.layout = options.layout.path
  this.source = options.layout.source.replace(/{{{\sbody\s}}}/, this.source)


  // let layoutContent = require('fs').readFileSync(options.layoutPath, 'utf-8')
  // if (layoutContent) {
  //   this.layout = options.layoutPath
  //   this.source = layoutContent.replace(/{{{\sbody\s}}}/, this.source)
  // }

}