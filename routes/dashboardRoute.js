
const app = require('express')
const router = app.Router()
// Load Schemas
const Cctv = require('../models/cctv');
const Report = require('../models/report');
// 3. Get reports of a place
router.get('/place/:locationId/reports', async (req, res) => {
    try {
      const reports = await Report.find({ locationId: req.params.locationId });
      res.json(reports);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  // 4. Get overall status of the place
  router.get('/dashboard', async (req, res) => {
    try {
      console.log("dashboard");
      const totalCCTVs = await Cctv.countDocuments();
      const totalReports = await Report.countDocuments();
      const locations = await Cctv.distinct('locationId');
      res.json({
        totalCCTVs,
        totalReports,
        locations,
        trafficDensity: Math.random().toFixed(2), // Random data
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

module.exports = router ;