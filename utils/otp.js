function generateOtp() {
    return Math.floor(1000 + Math.random() * 9000); // 4-digit OTP
  }
  
  function isOtpExpired(expiryTime) {
    return Date.now() > expiryTime;
  }
  
  module.exports = { generateOtp, isOtpExpired };