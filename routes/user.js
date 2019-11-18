const User = require('../models/user');

module.exports = app => {
  app.use('/user', (req, res, next) => {
    if (!req.is('application/json')) {
      res.status(400).send('Expects Content-Type to be application/json');
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
      let user = await User.findOne({ nickname: req.body.nickname });
      if (!user) {
        throw new Error('User does not exist.');
      }

      if (user.password != req.body.password) {
        throw new Error('Password does not match.');
      }

      res.status(201).send(user);
    } catch (err) {
      console.error(err);
      res.status(400).send(err.message);
    }
  });

  app.post('/user/signup', async (req, res) => {
    try {
      const user = await new User(req.body).save();
      res.status(201).send(user);
    } catch (err) {
      if (err.name === 'MongoError' && err.code === 11000) {
        err.message = 'Nickname already taken. Please, try another one.';
      }
      console.error(err);
      res.status(400).send(err.message);
    }
  });

  app.put('/user/add_friend', async (req, res) => {
    try {
      const user =
          await User.updateOne({ nickname: req.body.nickname }, req.body);
      res.status(200).send(user);
    } catch (err) {
      console.error(err);
      res.status(404).send(err.message);
    }
  });
};