const parsers = {
  html: require('./html'),
  css: require('./css'),
  js: require('./js'),
}


module.exports.extensions = Object.keys(parsers)


module.exports.parse = async function parse({ file, _id }) {
  if (file.type) {
    const parser = parsers[file.type]
    process.send({ result: parser(file.filename), done: _id })
  } else {
    process.send({ result: { filename: file.filename, content: null, deps: [] }, done: _id  })
  }
}
