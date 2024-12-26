const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  locationId : {
    type: String,
    required: true,
    unique: true
  },
  coordinates : {
    type: [Number],
    required: true
  },
  
});

module.exports = mongoose.model('Location', locationSchema);