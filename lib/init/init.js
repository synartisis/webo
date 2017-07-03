const fs = require('fs')

module.exports = async () => {

  const config = fs.readFileSync(__dirname + '/../config.js', 'utf8')
  fs.writeFileSync('./webo.config.js', config)
  
}
