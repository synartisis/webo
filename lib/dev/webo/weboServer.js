const { state } = require('../../state')
const utils = require('../../utils')

module.exports = async (req, res, WS_PORT) => {

  if (req.url === '/') return res.end(index())

  if (req.url === '/webo/state') return res.end(JSON.stringify(state))

  const filename = req.url.replace('/webo/', __dirname + '/')
  let content = await utils.readFileAsync(filename, 'utf8')
  if (filename.endsWith('/webo-socket.js')) content = content.replace('[WS_PORT]', WS_PORT)
  res.end(content)
  
}


function index() {
  return `
    <html>
      <head></head>
      <body>
        <p>
          No index.html found.
        </p>
        ${ state.entries.length > 0 ? 'found the following html pages :' : 'add an .html page to get started.' }
        <br>
        ${ state.entries.map(o => o.replace(state.config.srcRoot + '/', '')).filter(o => o.endsWith('.html')).map(o => `<a href="${o.replace('index.html', '')}">${o}</a><br>`).join('') }
        <script src="/webo/webo-socket.js"></script>
      </body>
    </html>
  `
}