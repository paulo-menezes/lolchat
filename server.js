const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const mongoose = require('mongoose');
const WebSocketServer = require('websocket').server;
const config = require('./config');
const jwt = require('jsonwebtoken');

const app = express();
const port = config.PORT;

app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json());
app.use('/api', ensureContentType);

if (!process.env.DEBUG) {
  const staticPath = path.join(__dirname, '/client/build');
  app.use(express.static(staticPath));
  app.get('/', function(req, res) {
    res.sendFile(path.join(staticPath, 'index.html'));
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
  const Message = require('./models/messages');

  const webSocketServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false,
  });
  
  const connections = {};

  webSocketServer.on('request', function(request) {
    var connection = request.accept('lolchat-prot', request.origin);
    const userToken = request.cookies
        .find(cookie => cookie.name === 'lolchat').value;
    jwt.verify(userToken, 'l0lch4t-s3cr3t', (err, decoded) => {
      if (err) { throw err };
      const { nickname } = decoded;
      connections[nickname] = connection;
  
      connection.on('message', async function(message) {
        const msg = await new Message(JSON.parse(message.utf8Data)).save();
        const stringfiedMsg = JSON.stringify(msg);
        const recipientConnection = connections[msg.to];
        if (recipientConnection) {
          connections[msg.to].send(stringfiedMsg);
        }
        connection.send(stringfiedMsg);
      });
    });
  });
});

db.once('error', (err) => console.error('Connection error:', err));

function ensureContentType(req, res, next) {
  if (!req.is('application/json')) {
    res.status(400).send('Expects Content-Type to be application/json');
  } else {
    next();
  }
}