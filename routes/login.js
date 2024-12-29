const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const generateToken = require("../utils/jwt");
const auth = require("../utils/auth");
const router = express.Router();

// Login API
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log(2);
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(3);
      return res.status(400).json({ error: "Invalid credentials" });
    }

    role = user.role;

    const token = generateToken(user);
    res
      .status(200)
      .json({ message: "Login successful", token, user, role: role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/userDataByToken", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
