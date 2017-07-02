const rollup = require('rollup')

module.exports = async (content, options) => {

  const { filename, bundle, type } = options

  if (bundle && type === 'module') {
    let rollupBundle = await rollup.rollup({ 
      entry: filename, 
    })
    let { code } = rollupBundle.generate({ format: 'iife' })
    content = code
  }


  return content

}