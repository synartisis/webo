const { globAsync } = require('../utils/utils.js')
const path = require('path')
const fs = require('fs')

module.exports = async function init(templateName = 'default') {

  const projectRoot = path.resolve('.')
  const localFiles = await globAsync(`${projectRoot}/*`)
  if (localFiles.length) {
    console.log('init can be used only in an emply directory')
    process.exit(1)
  }

  const templateFiles = await globAsync(`${__dirname}/../templates/${templateName}/**`)
  const templateRootPath = templateFiles[0] + '/'

  templateFiles.slice(1).forEach((filename, idx) => {
    const destFilename = filename.replace(templateRootPath, '')
    const destDirname = path.dirname(destFilename)
    mkdirp(destDirname)
    fs.copyFile(filename, destFilename, error => console.error(error))
  })
  console.log(`Project created using ${templateName} template. Run 'npm i' to install dependencies.`)

}


function mkdirp(dir, mode){
  try {
    fs.mkdirSync(dir, mode)
  } catch(err) {
    switch (err.code) {
      case 'ENOENT':
        mkdirp(path.dirname(dir), mode)
        mkdirp(dir, mode)
        break
      case 'EEXIST':
        break
      default:
        throw err
    }
  }
}