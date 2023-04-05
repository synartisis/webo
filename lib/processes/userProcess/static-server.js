import http from 'node:http'
import path from 'node:path'
import fs from 'node:fs'
import { stat, readdir } from 'node:fs/promises'
import mime from 'mime'


export function createStaticServer() {
  return http.createServer(staticRequestHandler).listen(3000, () => console.log('listening 3000'))
}


/** @type {http.RequestListener} */
async function staticRequestHandler(req, res) {
  // console.debug(req.url)
  const relpath = req.url?.split('?')[0]
  let filepath = path.resolve('.' + relpath)
  let stats = await tryStat(filepath)
  if (stats?.isDirectory()) {
    stats = await tryStat(path.join(filepath, 'index.html'))
    if (stats) {
      filepath = path.join(filepath, 'index.html')
    } else {
      const dirContent = await dirListing(filepath)
      res.setHeader('Content-Type', 'text/html')
      res.end(dirContent)
      return
    }
  }
  if (!stats) {
    res.statusCode = 404
    res.end()
    return
  }
  let ext = filepath.split('.').pop()
  const mimeType = mime.getType(ext ?? '')
  if (mimeType) res.setHeader('Content-Type', mimeType)
  const stream = fs.createReadStream(filepath)
  stream.pipe(res)
}


/** @type {(filename: string) => Promise<any>} */
async function tryStat(filename) {
  try {
    return await stat(filename)
  } catch (error) {
    return null
  }
}


/** @type {(dirpath: string) => Promise<string>} */
async function dirListing(dirpath) {
  let dirs = ''
  let files = ''
  const entries = await readdir(dirpath, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory()) {
      dirs += /*html*/`<div><a href="/${entry.name}/">${entry.name}/<a></div>`
    } else {
      files += /*html*/`<div><a href="/${entry.name}">${entry.name}<a></div>`
    }
  }
  return /*html*/`
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width">
      <title>webo index</title>
      <style>
        section > div { padding: .1rem 1rem; border-bottom: solid 1px #ddd; }
      </style>
    </head>
    <body>
      <h1>index of ${dirpath}</h1>
      <section class="dirs">
        ${dirs}
      </section>
      <section class="files">
        ${files}
      </section>
    </body>
    </html>
  `
}