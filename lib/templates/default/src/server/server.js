const express = require('express')
const bodyParser = require('body-parser')
const server = express()
const port = process.env.NODE_PORT || 3000

server.use(bodyParser.json())
server.use(express.static(__dirname + '/../client'))



server.listen(port, () => console.log('listening ' + port))

server.use((err, req, res, next) => errorsHandler(err))
process.on('unhandledRejection', (r, p) => p.catch(err => errorsHandler(err)))


function errorsHandler(error) {
  console.error(error)
}