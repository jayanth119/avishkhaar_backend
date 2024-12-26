const mongoose = require('mongoose');

const cctvSchema = new mongoose.Schema({
  cctvid : {
    type: String,
    required: true,
    unique: true
  },
    locationId : {
        type: String,
        required: true
    },
    coordinates : {
        type: [Number],
        required: true
    },
});

module.exports = mongoose.model('Cctv', cctvSchema);