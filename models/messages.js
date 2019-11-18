const mongoose = require('mongoose');
const timestamps = require('mongoose-timestamp');
const User = require('./user');

const  messageSchema = new mongoose.Schema({
  from: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  to: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  }
});

messageSchema.plugin(timestamps);

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;