const express = require('express');
const router = express.Router();
const User = require('../models/user');
const nodemailer = require('nodemailer');
function generateOtp() {
    return Math.floor(1000 + Math.random() * 9000); // 4-digit OTP
  }
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
router.post('/sendotp', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        // Generate OTP and set expiration time
        const otp = generateOtp();
        user.otp = otp;
        user.otpExpires = Date.now() + 5 * 60 * 1000; // OTP valid for 5 minutes
        await user.save();

        // Email content
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP code is ${otp}. It is valid for 5 minutes.`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        
        res.status(500).json({ error: 'Failed to send OTP', details: error.message });
    }
});

module.exports = router;