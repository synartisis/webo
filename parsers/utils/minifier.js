const terser = require(require.resolve('terser', { paths: [ process.cwd() ] }))


exports.minify = async function minify(content) {

  const { code, error } = terser.minify(content)
  if (error) log(error)

  return { content: code }

}