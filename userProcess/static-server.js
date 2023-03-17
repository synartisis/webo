import http from 'node:http'
import path from 'node:path'
import fs from 'node:fs'
import { stat } from 'node:fs/promises'
import mime from 'mime'


export function createStaticServer() {
  return http.createServer(staticRequestHandler).listen(3000, () => console.log('listening 3000'))
}

async function staticRequestHandler(req, res) {
  // console.log(req.url)
  const relpath = req.url.split('?')[0]
  let filepath = path.resolve('.' + relpath)
  let stream
  let found = false
  let stats
  try {
    stats = await stat(filepath)
  } catch (error) {}
  if (!stats || stats.isDirectory()) {
    try {
      stats = await stat(path.join(filepath, 'index.html'))
      filepath = path.join(filepath, 'index.html')
    } catch (error) {}
  }
  if (!stats) {
    res.statusCode = 404
    return res.end()
  }
  let ext = filepath.split('.').pop()
  res.setHeader('Content-Type', mime.getType(ext))
  stream = fs.createReadStream(filepath)
  stream.pipe(res)
}