const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { generateOtp } = require('../utils/otp');
const router = express.Router();


// Reusable function for user registration
const registerUser = async (userData, role, res) => {
  try {
    const { email } = userData;
   
    // Check for existing user by email or psbBadge if the role is 'driver'
    const existingUser = await User.findOne(role === 'admin' ? { $or: [{ email } ] } : { email });
    if (existingUser) {
      return res.status(400).json({ error: `User with this email ${role === 'admin' ? 'or psbBadge' : ''}already exists` });
    }

    // Hash password and generate OTP
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const otp = generateOtp();
    const otpExpires = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

    // Create new user
    const newUser = new User({
      ...userData,
      role,
      password: hashedPassword,
      otp,
      otpExpires
    });

    await newUser.save();

    // Send OTP to user via email or SMS
    // Note: Add actual email/SMS sending code here

    res.status(201).json({ message: `${role === 'driver' ? 'Driver' : 'User'} registered successfully, OTP sent to email` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Driver Signup API
router.post('/signup/driver', async (req, res) => {
  const { name, email ,  password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required for driver signup' });
  }

  await registerUser({ name, email :  password }, 'admin', res);
});

// Normal User Signup API
router.post('/signup/user', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  await registerUser({ name, email, password }, 'user', res);
});

module.exports = router;