const { readFileAsync, calcAssetPath, calcHash } = require('../../utils/utils.js')

const parsers = {
  html: require('./html'),
  css: require('./css'),
  js: require('./js'),
}

const fileBase = module.exports = {

  filename: null,

  ext: null,

  type: null,

  url() {
    if (!this.hash) return this.filename
    return this.filename.replace('.' + this.ext, `-${this.hash}.${this.ext}`)
  },

  content: undefined,
  async getContent() {
    if (!this.content) {
      await this.load()
      if (!this.content || !this.deps) throw new Error(`Loader [${this.ext}] does not update content or deps`)
    }
    return this.content
  },

  deps: [],

  referrer: null,

  hash: undefined,
  async getHash() {
    if (!this.hash) {
      this.hash = await calcHash(this.filename, this.content)
    }
    return this.hash
  },

  options: null,

  async loadSource() {
    const source = await readFileAsync(this.sourceFilename || this.filename)
    return source && source.toString()
  },

  calcAssetPath,

  async parse() {
    if (!this.content) {
      await this.load()
      if (this.options.parserOptions.hash) this.hash = await calcHash(this.filename, this.content)
    }
  },

  async load() {
    // throw new Error(`No loader defined for [${this.ext}]`)
    // console.log('**', this.filename, this.sourceFilename)
    this.content = await readFileAsync(this.sourceFilename || this.filename)
  },

  createFile(filename, type) {
    const file = Object.create(fileBase)
    const ext = filename.split('.').pop()
    const parser = parsers[ext]
    Object.assign(file, { filename, type, ext }, parser)
    return file
  },

  init(options, attachFile) {
    this.options = options
    this.attachFile = attachFile
  }

}