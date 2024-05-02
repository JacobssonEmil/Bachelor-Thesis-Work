const mongoose = require('mongoose');
const User = require('../models/User')
const generateTestData = require('./generateTestData');
const testWritePerformance = require('./testWritePerformance');
const testReadPerformance = require('./testReadPerformance');
const testUpdatePerformance = require('./testUpdatePerformance');
const testDeletePerformance = require('./testDeletePerformance');
const {
  testDemographicStatusDistributionPerformance,
  testInactivityAnalysisPerformance,
  testUserRetentionAnalysisPerformance
} = require('./testComplexQueryPerformance');

const scales = [100, 1000, 10000, 100000, 1000000]; // Different scales to test

// MongoDB Connection URI
const mongoURI = 'mongodb://localhost:27017/testdb';

async function warmUpDatabase() {
  console.log('Warming up database...');
  const smallScale = 10000; // Adjust the scale for warm-up
  const testData = await generateTestData(smallScale);
  await User.insertMany(testData);
  console.log('Database warmed up successfully.');
}

async function runTests() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected successfully.');
    await User.deleteMany({});

    // Warm up the database
    await warmUpDatabase();

    for (const scale of scales) {
      console.log(`\n\nTesting with ${scale} records...`);

      // Clean up existing data
      await User.deleteMany({});

      // Generate test data
      const testData = await generateTestData(scale);
      await User.insertMany(testData);

      // Test CRUD Performance
      const writeDuration = await testWritePerformance(testData);
      console.log(`Write Duration for ${scale} records: ${writeDuration} ms`);

      const points = [Math.floor(scale / 1.5), Math.floor(scale / 2), Math.floor(scale / 3)]; // 67%, 50%, and 33% marks
      let totalReadDuration = 0;
      let totalUpdateDuration = 0;
      let totalDeleteDuration = 0;

      for (const point of points) {
        const sampleUser = testData[point];
    
        const readDuration = await testReadPerformance(sampleUser);
        totalReadDuration += parseFloat(readDuration);
    
        const updateDuration = await testUpdatePerformance({ originalEmail: sampleUser.email, newEmail: `updated_${sampleUser.email}` });
        totalUpdateDuration += parseFloat(updateDuration);
    
        const deleteDuration = await testDeletePerformance(sampleUser.email);
        totalDeleteDuration += parseFloat(deleteDuration);
    }

      const averageReadDuration = totalReadDuration / points.length;
      const averageUpdateDuration = totalUpdateDuration / points.length;
      const averageDeleteDuration = totalDeleteDuration / points.length;

      console.log(`Average Read Duration for ${scale} records: ${averageReadDuration.toFixed(3)} ms`);
      console.log(`Average Update Duration for ${scale} records: ${averageUpdateDuration.toFixed(3)} ms`);
      console.log(`Average Delete Duration for ${scale} records: ${averageDeleteDuration.toFixed(3)} ms`);

      // Test Complex Query Performance
      console.log(`Running complex query tests for ${scale}`);
      await testUserRetentionAnalysisPerformance();
      await testDemographicStatusDistributionPerformance();
      await testInactivityAnalysisPerformance();
    }

    // Disconnect from MongoDB
    await User.deleteMany({});
    await mongoose.disconnect();
    console.log('MongoDB disconnected successfully.');
  } catch (error) {
    console.error('An error occurred during the tests:', error);
  }
}

runTests();
