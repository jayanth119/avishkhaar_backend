const app = require('express')
const router = app.Router()
// Load Schemas

const Caption = require('../models/caption');


// Get captions for a specific place and CCTV
router.get('/place/cctvid/getsummary', async (req, res) => {
    try {
      const locationId = req.query.locationId;
      const cctvid = req.query.cctvid;
      const captions = await Caption.find({ locationId, cctvid });
      res.json(captions);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  });

  module.exports = router ; 