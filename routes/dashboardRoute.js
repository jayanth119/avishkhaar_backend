const app = require("express");
const router = app.Router();
// Load Schemas
const User = require("../models/user");
const Cctv = require("../models/cctv");
const Report = require("../models/report");
const auth = require("../utils/auth");

// 3. Get reports of a place
router.get("/place/:locationId/reports", async (req, res) => {
  try {
    const reports = await Report.find({ locationId: req.params.locationId });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Get overall status of the place
router.get("/dashboard", auth, async (req, res) => {
  try {
    const { userId, role } = req.user;

    if (role !== "admin") {
      return res.status(403).json({ error: "Not valid user" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { locationId } = user;

    const cctvs = await Cctv.find({ locationId });
    const totalCCTVs = await Cctv.countDocuments();
    const totalReports = await Report.countDocuments();

    res.json({
      totalCCTVs,
      totalReports,
      trafficDensity: Math.random().toFixed(2),
      cctvLocations: cctvs,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
