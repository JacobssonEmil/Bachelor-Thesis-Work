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

const scales = [100, 1000, 10000, 100000]; // Different scales to test

// MongoDB Connection URI
const mongoURI = 'mongodb://localhost:27017/testdb';

async function runTests() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected successfully.');

    for (const scale of scales) {
      console.log(`Testing with ${scale} records...`);

      // Clean up existing data
      await User.deleteMany({});

      // Generate test data
      const testData = await generateTestData(scale);
      await User.insertMany(testData);

      // Test CRUD Performance
      const writeDuration = await testWritePerformance(testData);
      console.log(`Write Duration for ${scale} records: ${writeDuration} ms`);
      const readDuration = await testReadPerformance(scale);
      console.log(`Read Duration for ${scale} records: ${readDuration} ms`);
      const sampleUser = testData[Math.floor(Math.random() * testData.length)];
      const updateDuration = await testUpdatePerformance({ originalEmail: sampleUser.email, newEmail: `updated_${sampleUser.email}` });
      console.log(`Update Duration for ${scale} records: ${updateDuration} ms`);
      const deleteDuration = await testDeletePerformance(sampleUser.email);
      console.log(`Delete Duration for ${scale} records: ${deleteDuration} ms`);

      // Test Complex Query Performance
      console.log(`Running complex query tests for ${scale}`);
      await testUserRetentionAnalysisPerformance();
      await testDemographicStatusDistributionPerformance();
      await testInactivityAnalysisPerformance();
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected successfully.');
  } catch (error) {
    console.error('An error occurred during the tests:', error);
  }
}

runTests();
