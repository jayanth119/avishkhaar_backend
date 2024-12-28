const mongoose = require('mongoose');
const Location = require('../models/location');
const CCTV = require('../models/cctv');
const Caption = require('../models/caption');
const User = require('../models/user');
const Report = require('../models/report');
const { faker } = require('@faker-js/faker');

// MongoDB connection string
const mongoUri = 'mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.3.3';

// Connect to MongoDB
mongoose.connect(mongoUri)
  .then(() => console.log('Connected to MongoDB successfully.'))
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1); // Exit if the connection fails
  });

async function generateData() {
  try {
    // Generate random locations
    const locations = [];
    for (let i = 0; i < 10; i++) {
      locations.push({
        name: faker.location.city(),
        locationId: faker.string.uuid(), // Corrected method for generating UUID
        coordinates: [parseFloat(faker.location.latitude()), parseFloat(faker.location.longitude())],
      });
    }
    const insertedLocations = await Location.insertMany(locations);

    // Generate random CCTVs
    const cctvs = [];
    for (let i = 0; i < 50; i++) {
      const randomLocation = insertedLocations[Math.floor(Math.random() * insertedLocations.length)];
      cctvs.push({
        cctvid: faker.string.uuid(), // Corrected method for generating UUID
        locationId: randomLocation.locationId,
        coordinates: [
          parseFloat(randomLocation.coordinates[0]) + (Math.random() - 0.5) * 0.01,
          parseFloat(randomLocation.coordinates[1]) + (Math.random() - 0.5) * 0.01,
        ],
      });
    }
    const insertedCCTVs = await CCTV.insertMany(cctvs);

    // Generate random captions
    const captions = [];
    for (let i = 0; i < 200; i++) {
      const randomCCTV = insertedCCTVs[Math.floor(Math.random() * insertedCCTVs.length)];
      captions.push({
        cctvid: randomCCTV.cctvid,
        locationId: randomCCTV.locationId,
        caption: faker.lorem.sentence(),
        date: faker.date.past(),
      });
    }
    await Caption.insertMany(captions);

    // Generate random users
    const users = [];
    for (let i = 0; i < 10; i++) {
      users.push({
        name: faker.person.fullName(), // Corrected method for generating full name
        email: faker.internet.email(),
        role: faker.helpers.arrayElement(['user', 'admin']),
        password: faker.internet.password({ length: 8 }),
        otp: Math.floor(1000 + Math.random() * 9000),
        otpExpires: faker.date.future(),
      });
    }
    const insertedUsers = await User.insertMany(users);

    // Generate random reports
    const reports = [];
    for (let i = 0; i < 30; i++) {
      const randomCCTV = insertedCCTVs[Math.floor(Math.random() * insertedCCTVs.length)];
      const randomUser = insertedUsers[Math.floor(Math.random() * insertedUsers.length)];
      reports.push({
        locationId: randomCCTV.locationId,
        cctvid: randomCCTV.cctvid,
        description: faker.lorem.paragraph(),
        reportedBy: randomUser._id,
        reportedAt: faker.date.past(),
      });
    }
    await Report.insertMany(reports);

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Failed to seed database:', error.message);
  }
}


generateData();
