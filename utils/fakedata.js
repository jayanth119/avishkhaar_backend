// In your seed route (e.g., /api/data/seed)
const faker = require('faker');

app.post('/api/data/seed', async (req, res) => {
  try {
    // Generate random locations
    const locations = [];
    for (let i = 0; i < 10; i++) {
      locations.push({
        name: faker.address.city(),
        locationId: faker.random.uuid(), // Use UUID for unique IDs
        coordinates: [faker.address.latitude(), faker.address.longitude()],
      });
    }
    await Location.insertMany(locations);

    // Generate random CCTVs
    const cctvs = [];
    for (let i = 0; i < 50; i++) {
      const randomLocationIndex = Math.floor(Math.random() * locations.length);
      cctvs.push({
        cctvid: faker.random.uuid(),
        locationId: locations[randomLocationIndex].locationId,
        coordinates: [
          locations[randomLocationIndex].coordinates[0] +
            (Math.random() - 0.5) * 0.01, // Randomize coordinates slightly
          locations[randomLocationIndex].coordinates[1] +
            (Math.random() - 0.5) * 0.01,
        ],
      });
    }
    await CCTV.insertMany(cctvs);

    // Generate random captions
    const captions = [];
    for (let i = 0; i < 200; i++) {
      const randomCctvIndex = Math.floor(Math.random() * cctvs.length);
      captions.push({
        cctvid: cctvs[randomCctvIndex].cctvid,
        locationId: cctvs[randomCctvIndex].locationId,
        caption: faker.lorem.sentence(),
        date: faker.date.past(),
      });
    }
    await Caption.insertMany(captions);

    // ... (Generate random users and reports similarly)

    res.json({ message: 'Database seeded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error seeding database' });
  }
});