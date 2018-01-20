const express = require('express')
const bodyParser = require('body-parser')
const server = express()
const port = process.env.NODE_PORT || 3000

server.use(bodyParser.json())
server.use(express.static(__dirname + '/../client'))



server.listen(port, () => console.log('listening ' + port))
