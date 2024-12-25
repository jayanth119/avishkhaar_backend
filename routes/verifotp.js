const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Verify OTP Route
router.post('/verifyotp', async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {

        return res.status(400).json({ error: 'Email and OTP are required' });
    }

    try {
        const user = await User.findOne({ email });
        // || user.otpExpires < Date.now()
        
        if (!user || user.otp !== otp ) {

            
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        // OTP verified successfully, clear the OTP fields
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        res.status(200).json({ message: 'OTP verified successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;