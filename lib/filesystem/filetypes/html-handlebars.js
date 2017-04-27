// module.exports = (file, options) => {

//   if (file.content.includes('<html ')) return file // if page has html tag, ignore layout
//   let layoutContent = require('fs').readFileSync(options.layoutPath, 'utf-8')
//   if (layoutContent) {
//     file.layout = options.layoutPath
//     file.content = layoutContent.replace(/{{{\sbody\s}}}/, file.content)
//   }
//   return file

// }