const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    required: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  otp: {
    type: Number,
    min: 1000,
    max: 9999
  },
  otpExpires: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);