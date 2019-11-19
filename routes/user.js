const User = require('../models/user');
const Message = require('../models/messages');

module.exports = app => {
  app.use('/user', (req, res, next) => {
    if (!req.is('application/json')) {
      res.status(400).send({ error: 'Expects Content-Type to be application/json' });
    } else {
      next();
    }
  });

  app.get('/users', async (req, res) => {
    const users = await User.find();
    res.status(200).send(users);
  });

  app.post('/user/signin', async (req, res) => {
    try {
      let document = await User.findOne({ nickname: req.body.nickname });
      if (!document) {
        throw new Error('User does not exist.');
      }

      if (document.password != req.body.password) {
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
      user.friends = [];
      user.messages = messages || [];

      res.status(200).send(user);
    } catch (err) {
      console.error(err);
      res.status(400).send({ error: err.message });
    }
  });

  app.post('/user/signup', async (req, res) => {
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
      user.friends = [];
      user.messages = messages || [];

      res.status(200).send(user);
    } catch (err) {
      if (err.name === 'MongoError' && err.code === 11000) {
        err.message = 'Nickname already taken. Please, try another one.';
      }
      console.error(err);
      res.status(400).send({ error: err.message });
    }
  });

  app.put('/user/add_friend', async (req, res) => {
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