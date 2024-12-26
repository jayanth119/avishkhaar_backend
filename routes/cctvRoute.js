
const app = require('express')
const router = app.Router()
const Report = require('../models/report');
const CCTV = require('../models/cctv');

// Get total number of CCTVs in a place
router.get('/place/cctv/', async (req, res) => {
    try {
      const locationId = req.query.locationId;
      const cctvCount = await CCTV.countDocuments({ locationId });
      res.json({ cctvCount });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  });

// Get reports for a specific CCTV
router.get('/place/cctvid/report', async (req, res) => {
    try {
      const cctvid = req.query.cctvid;
      const reports = await Report.find({ cctvid }).populate('reportedBy');
      res.json(reports);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  });
// Get reports for a specific place
router.get('/place/report', async (req, res) => {
    try {
      const locationId = req.query.locationId;
      const reports = await Report.find({ locationId }).populate('reportedBy');
      res.json(reports);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  });
  
  // Get overall status of a place (simplified)
  router.get('/dashboard', async (req, res) => {
    try {
      const locationId = req.query.locationId; 
      const cctvCount = await CCTV.countDocuments({ locationId });
      const reportCount = await Report.countDocuments({ locationId });
      // ... (Calculate area latitudes and traffic density logic here) 
      res.json({ cctvCount, reportCount, /* ... other status data */ });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  });
  
module.exports = router ; 