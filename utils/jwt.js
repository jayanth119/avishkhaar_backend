// utils/jwt.js
const jwt = require('jsonwebtoken');
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }  // Token expires in 1 day
  );
};

module.exports = generateToken;