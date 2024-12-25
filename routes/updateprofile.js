const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const router = express.Router();

// Middleware to validate JWT and extract user data
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Authorization token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded user info (userId, role) to the request
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Update Profile Route
router.put('/updateprofile', authenticate, async (req, res) => {
    try {
        console.log(req.body);
      const userId = req.user.userId; // User ID from the JWT
      const role = req.user.role;    // Role from the JWT
      const updates = req.body;
  
      // Check if the request body contains valid data
      if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).json({ error: updates});
      }
  
      // Define allowed fields based on the role
      const allowedFields = role === 'admin' 
        ? ['name', 'email',  'password']
        : ['name', 'email', 'password'];
  
      // Filter updates to include only allowed fields
      const filteredUpdates = {};
      Object.keys(updates).forEach((key) => {
        if (allowedFields.includes(key)) {
          filteredUpdates[key] = updates[key];
        }
      });
  
      // If the user wants to update the password, hash it
      if (filteredUpdates.password) {
        const hashedPassword = await bcrypt.hash(filteredUpdates.password, 10);
        filteredUpdates.password = hashedPassword;
      }
  
      // Find the user by ID and update their profile
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: filteredUpdates },
        { new: true } // Return the updated document
      );
  
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found.' });
      }
  
      res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

module.exports = router;