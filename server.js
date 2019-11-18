const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const WebSocketServer = require('websocket').server;
const config = require('./config');

const app = express();
const port = config.PORT;

app.use(cors());
app.use(bodyParser.json());

if (!process.env.DEBUG) {
  app.use(express.static(path.join(__dirname, '/build')))
  app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, '/build', 'index.html'));
  });
}

const server = app.listen(port, async () => {
  console.log(`Listening on port ${port}`)
  console.log('Connecting to database...');
  mongoose.connect(config.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

const db = mongoose.connection;
db.once('open', () => {
  console.log('Connection to database estabilished');
  require('./routes/user')(app);
  require('./routes/messages')(app);
  const Message = require('./models/messages');

  const webSocketServer = new WebSocketServer({
    httpServer: server
  });
  
  webSocketServer.on('request', function(request) {
    var connection = request.accept('lolchat-prot', request.origin);
  
    connection.on('message', function(message) {
      console.log('Received Message: ' + message.utf8Data);
      new Message(JSON.parse(message.utf8Data)).save();
      connection.sendUTF(message.utf8Data);
    });
  
    connection.on('close', function(reasonCode, description) {
      console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
  });
});

db.once('error', (err) => console.error('Connection error:', err));