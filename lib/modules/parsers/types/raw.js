module.exports = async function raw(file) {

  Object.assign(file, { content: null, deps: [] })
  return file

}