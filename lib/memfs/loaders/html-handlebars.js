module.exports = function(options) {

  if (this.source.includes('<html ')) return // if page has html tag, ignore layout
  this.layout = options.layout.path
  this.content = options.layout.content.replace(/{{{\sbody\s}}}/, this.source)

}