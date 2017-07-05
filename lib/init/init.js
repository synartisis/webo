const fs = require('fs')

module.exports = async () => {

  let weboConfigExists = false
  try {
    fs.lstatSync('./webo.config.js')
    weboConfigExists = true
  } catch (error) { }

  if (!weboConfigExists) {
    const config = fs.readFileSync(__dirname + '/../config.js', 'utf8')
    fs.writeFileSync('./webo.config.js', config)
  } else {
    console.error('webo.config.js already exists. Rename it or remove it and run "webo init" again')
  }
  
}
