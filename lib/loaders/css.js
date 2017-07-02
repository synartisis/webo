const path = require('path')
const postcss = require('postcss')
const atImport = require("postcss-import")

module.exports = async (content, options) => {
  
  const { mode, filename, bundle } = options

  if (bundle)   {
    const dirname = path.dirname(filename)
    const result = await postcss()
      .use(atImport({ path: dirname }))
      .process(content)
    content = result.content
  }
  
  return content

}
