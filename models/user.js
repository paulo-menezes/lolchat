const mongoose = require('mongoose');
const timestamps = require('mongoose-timestamp');

const userSchema = new mongoose.Schema({
  nickname: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  friends: [String],
});

userSchema.plugin(timestamps);

const User = mongoose.model('User', userSchema);

module.exports = User;