const app = require('express')
const router = app.Router()
// Load Schemas

const Caption = require('../models/caption');


// 2. Get captions of place and particular CCTV
router.get('/place/:locationId/:cctvid/getsummary', async (req, res) => {
  try {
    const captions = await Caption.find({
      locationId: req.params.locationId,
      cctvid: req.params.cctvid,
    });
    res.json(captions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


  module.exports = router ; 