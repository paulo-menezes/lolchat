const Message = require('../models/messages');

module.exports = app => {
  app.use('/messages', (req, res, next) => {
    if (!req.is('application/json')) {
      res.status(400).send('Expects Content-Type to be application/json');
    } else {
      next();
    }
  });

  app.get('/messages', async (req, res) => {
    try {
      let messages = await Message.find({
        $or: [
          {
            from: req.body.from,
            to: req.body.to
          },
          {
            from: req.body.to,
            to: req.body.from
          }
        ]
      });

      res.status(201).send(messages);
    } catch (err) {
      console.error(err);
      res.status(400).send(err.message);
    }
  });

  app.post('/messages', async (req, res) => {
    try {
      let messages = await new Message(req.body).save();
      res.status(201).send(messages);
    } catch (err) {
      console.error(err);
      res.status(400).send(err.message);
    }
  });
};