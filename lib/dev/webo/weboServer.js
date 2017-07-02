const { promisify } = require('util')
const fs = require('fs')

module.exports = async (req, res, entries, WS_PORT) => {

  if (req.url === '/') return res.end(index(entries))

  const filename = req.url.replace('/webo/', __dirname + '/')
  let content = await promisify(fs.readFile)(filename, 'utf8')
  if (filename.endsWith('/webo-socket.js')) content = content.replace('[WS_PORT]', WS_PORT)
  res.end(content)
  
}


function index(entries) {
  return `
    <p>
      nothing here, found the following html pages
    </p>
    ${ entries.filter(o => o.endsWith('.html')).map(o => '<a href="' + o.replace('index.html', '') + '">' + o + '</a><br>') }
  `
}