const mongoose = require('mongoose');

const captionSchema = new mongoose.Schema({
  cctvid : {
    type: String,
    required: true,
    unique: true
  },
    locationId : {
        type: String,
        required: true
    },

    caption : {
        type: String,
        required: true
    } , 
    date : {
        type: Date,
        required: true
    }
  
});

module.exports = mongoose.model('Caption', captionSchema);