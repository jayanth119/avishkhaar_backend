const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    locationId: {
      type: String, // Corrected type declaration
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: false, // Made optional
    },
    firebaseToken: {
      type: String, // Store the FCM token for push notifications
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
