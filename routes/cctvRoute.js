
const app = require('express')
const router = app.Router()
// Load Schemas
const Cctv = require('../models/cctv');
const Caption = require('../models/caption');
const Report = require('../models/report');

// 1. Total number of CCTV in a place
router.get('/place/:locationId/cctv', async (req, res) => {
  try {
  
    const count = await Cctv.countDocuments({ locationId: req.params.locationId });
    const cctvids = await Cctv.find({ locationId: req.params.locationId });
    res.json({ locationId: req.params.locationId, totalCCTVs: count , cctvids  : cctvids });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router ; 