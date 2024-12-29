const express = require("express");
const router = express.Router();
const Report = require("../models/report");
const Cctv = require("../models/cctv");
const admin = require("firebase-admin"); // Firebase Admin SDK
const geolib = require("geolib");
// admin.initializeApp({
//   credential: admin.credential.cert('google-services.json'), // Firebase Service Account Key
// });

const MAX_DISTANCE = 20000; // 20 km in meters

// Helper function to find nearby users
const findNearbyUsers = async (location) => {
  const users = await User.find();
  return users.filter((user) =>
    geolib.isPointWithinRadius(
      { latitude: location[0], longitude: location[1] },
      { latitude: user.coordinates[0], longitude: user.coordinates[1] },
      MAX_DISTANCE
    )
  );
};

// Report traffic issue with notification
router.post("/report", async (req, res) => {
  const { title, description, location, priority, reportedBy } = req.body;

  if (!["Accident", "Theft", "Road Block"].includes(description)) {
    return res.status(400).json({ error: "Invalid description" });
  }

  try {
    // Find the closest CCTV
    const cctvs = await Cctv.find();
    const nearestCCTV = cctvs.find((cctv) =>
      geolib.isPointWithinRadius(
        { latitude: location[0], longitude: location[1] },
        { latitude: cctv.coordinates[0], longitude: cctv.coordinates[1] },
        MAX_DISTANCE
      )
    );

    if (!nearestCCTV) {
      return res.status(400).json({ error: "No nearby CCTV found" });
    }

    // Create the report
    const report = new Report({
      title: title,
      locationId: nearestCCTV.locationId,
      cctvid: nearestCCTV.cctvid,
      description,
      reportedBy,
      reportedAt: new Date(),
    });
    await report.save();

    // Find nearby users
    // const nearbyUsers = await findNearbyUsers(location);
    // const tokens = nearbyUsers.map((user) => user.fcmToken).filter(Boolean);

    // if (tokens.length > 0) {
    //   // Send notification via Firebase
    //   await admin.messaging().sendMulticast({
    //     tokens,
    //     notification: {
    //       title: "Traffic Incident Reported",
    //       body: `${description} reported at ${priority} priority.`,
    //     },
    //   });
    // }

    res.status(201).json({
      message: "Traffic issue reported successfully, notifications sent",
      report,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

module.exports = router;
