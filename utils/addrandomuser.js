const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const User = require('../models/user'); // Adjust the path to your User model
const dotenv = require("dotenv");
dotenv.config();
const uri = process.env.MONGO_URI;
mongoose.connect(uri, );

const addRandomUsers = async (count) => {
  try {
    const users = [];

    for (let i = 0; i < count; i++) {
      const shouldAddCoordinates = Math.random() > 0.5; // Randomly decide if coordinates should be added
        names = faker.faker.person.firstName( )
       const user = {
        name: names, 
        email: names + '@example.com',
        role: ['user', 'admin'][Math.floor(Math.random() * 2)], // Randomly select between 'user' and 'admin'
        password: names,
        firebaseToken: faker.datatype.uuid(), // Fake FCM token
      };

      if (shouldAddCoordinates) {
        user.coordinates = [
          parseFloat(faker.location.longitude()),
          parseFloat(faker.location.latitude()),
        ];
      }

      users.push(user);
    }

    await User.insertMany(users);
    console.log(`${count} random users added successfully!`);
  } catch (error) {
    console.error('Error adding users:', error);
  } finally {
    mongoose.connection.close();
  }
};

addRandomUsers(10); // Add 10 random users
