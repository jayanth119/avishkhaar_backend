const reportSchema = new mongoose.Schema({
    locationId: {
      type: String,
      required: true,
    },
    cctvid: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', 
      required: true,
    },
    reportedAt: {
      type: Date,
      default: Date.now,
    },
  });
  
  module.exports = mongoose.model('Report', reportSchema);