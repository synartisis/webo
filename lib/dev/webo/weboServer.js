const { promisify } = require('util')
const fs = require('fs')

module.exports = async (req, res, entries, WS_PORT, srcRoot) => {

  if (req.url === '/') return res.end(index(entries, srcRoot))

  const filename = req.url.replace('/webo/', __dirname + '/')
  let content = await promisify(fs.readFile)(filename, 'utf8')
  if (filename.endsWith('/webo-socket.js')) content = content.replace('[WS_PORT]', WS_PORT)
  res.end(content)
  
}


function index(entries, srcRoot) {
  return `
    <p>
      No index.html found.
    </p>
    ${ entries.length > 0 ? 'found the following html pages :' : 'add an .html page to get started.' }
    <br>
    ${ entries.filter(o => o.endsWith('.html')).map(o => o.replace(srcRoot, '')).map(o => `<a href="${o.replace('index.html', '')}">${o}</a><br>`) }
    <script src="/webo/webo-socket.js"></script>
  `
}