const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const Location = require("../models/location");

const router = express.Router();

// Reusable function for user registration
const registerUser = async (userData, role, res) => {
  try {
    const { email } = userData;

    const existingUser = await User.findOne(
      role === "admin" ? { $or: [{ email }] } : { email }
    );
    if (existingUser) {
      return res.status(400).json({
        error: `User with this email ${
          role === "admin" ? "or psbBadge" : ""
        }already exists`,
      });
    }

    // Hash password and generate OTP
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const newUser = new User({
      ...userData,
      role,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({
      message: `${
        role === "driver" ? "Driver" : "User"
      } registered successfully, OTP sent to email`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// Driver Signup API
router.post("/signup/admin", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "All fields are required for driver signup" });
  }

  await registerUser({ name, email: password }, "admin", res);
});

// Normal User Signup API
router.post("/signup/user", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "Name, email, and password are required" });
  }

  await registerUser({ name, email, password }, "user", res);
});

router.get("/locations", async (req, res) => {
  try {
    const locations = await Location.find({}, "name locationId");

    const locationsData = locations.map((location) => ({
      name: location.name,
      locationId: location.locationId,
    }));

    return res.status(200).json({
      message: "Locations Fetched Successfully",
      locations: locationsData,
    });
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
