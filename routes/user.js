const User = require('../models/user');
const Message = require('../models/messages');
const jwt = require('jsonwebtoken');

module.exports = app => {
  app.post('/api/user/signin', async (req, res) => {
    try {
      if (req.body.token) {
        jwt.verify(req.body.token, 'l0lch4t-s3cr3t', (err, decoded) => {
          if (err) { res.sendStatus(403); }
          Object.assign(req.body, decoded);
        });
      }
      let document = await User.findOne({ nickname: req.body.nickname });
      if (!document) {
        throw new Error('User does not exist.');
      }

      if (!req.body.token && document.password != req.body.password) {
        throw new Error('Password does not match.');
      }

      const messages = await Message.find({
        $or: [
          {
            from: req.body.nickname,
          },
          {
            to: req.body.nickname
          }
        ]
      });

      const user = {};
      user.nickname = document.nickname;

      jwt.sign(user, 'l0lch4t-s3cr3t', (err, encoded) => {
        if (err) { res.sendStatus(403); }
        user.token = encoded;
        user.friends = [];
        user.messages = messages || [];
        res.status(200).send(user);
      });
    } catch (err) {
      console.error(err);
      res.status(400).send({ error: err.message });
    }
  });

  app.post('/api/user/signup', async (req, res) => {
    try {
      const document = await new User(req.body).save();

      const messages = await Message.find({
        $or: [
          {
            from: req.body.nickname,
          },
          {
            to: req.body.nickname
          }
        ]
      });

      const user = {};
      user.nickname = document.nickname;
      
      jwt.sign(user, 'lolchat-secret', (err, encoded) => {
        if (err) { res.sendStatus(403); }
        user.token = encoded;
        user.friends = [];
        user.messages = messages || [];
        res.status(200).send(user);
      });
    } catch (err) {
      if (err.name === 'MongoError' && err.code === 11000) {
        err.message = 'Nickname already taken. Please, try another one.';
      }
      console.error(err);
      res.status(400).send({ error: err.message });
    }
  });

  app.put('/api/user/add_friend', async (req, res) => {
    try {
      const document =
          await User.updateOne({ nickname: req.body.nickname }, req.body);
      const messages = await Message.find({
        $or: [
          {
            from: req.body.nickname,
          },
          {
            to: req.body.nickname
          }
        ]
      });
      const user = {};
      user.nickname = document.nickname;
      user.friends = document.friends || [];
      user.messages = messages || [];
      res.status(200).send(user);
    } catch (err) {
      console.error(err);
      res.status(400).send({ error: err.message });
    }
  });
};