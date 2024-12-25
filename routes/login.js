const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const generateToken = require('../utils/jwt');
const router = express.Router();

// Login API
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) { 
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log(2);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(3);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Clear OTP fields if they exist
    role = user.role ; 
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const token = generateToken(user);
    res.status(200).json({ message: 'Login successful', token , 'role' : role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;