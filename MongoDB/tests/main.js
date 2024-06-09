const mongoose = require('mongoose');
const User = require('../models/User');
const generateTestData = require('./generateTestData');
const testWritePerformance = require('./testWritePerformance');
const testReadPerformance = require('./testReadPerformance');
const testUpdatePerformance = require('./testUpdatePerformance');
const testDeletePerformance = require('./testDeletePerformance');
const {
  testUserRetentionAnalysisPerformance,
  testDemographicStatusDistributionPerformance,
  testInactivityAnalysisPerformance
} = require('./testComplexQueryPerformance');

const scales = [100, 1000, 10000, 100000, 1000000]; 
const numRuns = 10; 

// MongoDB Connection URI
const mongoURI = 'mongodb://localhost:27017/testdb';

async function warmUpDatabase() {
  console.log('Warming up database...');
  const smallScale = 100; // Adjust the scale for warm-up
  const testData = await generateTestData(smallScale);
  await User.insertMany(testData);
  console.log('Database warmed up successfully.');
}

async function runTests() {
  try {
    await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected successfully.');

    const results = {};
    for (const scale of scales) {
      results[scale] = {
        totalWriteDuration: 0,
        totalReadDuration: 0,
        totalUpdateDuration: 0,
        totalDeleteDuration: 0,
        totalUserRetentionAnalysisDuration: 0,
        totalDemographicStatusDistributionDuration: 0,
        totalInactivityAnalysisDuration: 0
      };
    }

    for (let run = 0; run < numRuns; run++) {
      console.log(`\nStarting run ${run + 1}...`);

      // Warm up the database
      await warmUpDatabase();
      
      for (const scale of scales) {
        console.log(`Testing with ${scale} records...`);
        await User.deleteMany({});
        const testData = await generateTestData(scale);
        
        // Test CRUD Performance
        const writeDuration = await testWritePerformance(testData);
        results[scale].totalWriteDuration += parseFloat(writeDuration);

        const points = [Math.floor(scale / 1.5), Math.floor(scale / 2), Math.floor(scale / 3)];
        for (const point of points) {
          const sampleUser = testData[point];
      
          const readDuration = await testReadPerformance(sampleUser);
          results[scale].totalReadDuration += parseFloat(readDuration);
      
          const updateDuration = await testUpdatePerformance({ originalEmail: sampleUser.email, newEmail: `updated_${sampleUser.email}` });
          results[scale].totalUpdateDuration += parseFloat(updateDuration);
      
          const deleteDuration = await testDeletePerformance(`updated_${sampleUser.email}`);
          results[scale].totalDeleteDuration += parseFloat(deleteDuration);
        }

        // Test Complex Query Performance
        const userRetentionAnalysisDuration = await testUserRetentionAnalysisPerformance();
        const demographicStatusDistributionDuration = await testDemographicStatusDistributionPerformance();
        const inactivityAnalysisDuration = await testInactivityAnalysisPerformance();

        results[scale].totalUserRetentionAnalysisDuration += parseFloat(userRetentionAnalysisDuration);
        results[scale].totalDemographicStatusDistributionDuration += parseFloat(demographicStatusDistributionDuration);
        results[scale].totalInactivityAnalysisDuration += parseFloat(inactivityAnalysisDuration);
      }
    }

    // Calculate and log averages
    console.log('\nAggregated Test Results:');
    for (const scale of scales) {
      console.log(`\nScale: ${scale}`);
      console.log(`Average Write Duration: ${(results[scale].totalWriteDuration / numRuns).toFixed(3)} ms`);
      console.log(`Average Read Duration: ${(results[scale].totalReadDuration / (numRuns * 3)).toFixed(3)} ms`);
      console.log(`Average Update Duration: ${(results[scale].totalUpdateDuration / (numRuns * 3)).toFixed(3)} ms`);
      console.log(`Average Delete Duration: ${(results[scale].totalDeleteDuration / (numRuns * 3)).toFixed(3)} ms`);
      console.log(`Average User Retention Analysis Duration: ${(results[scale].totalUserRetentionAnalysisDuration / numRuns).toFixed(3)} ms`);
      console.log(`Average Demographic Status Distribution Duration: ${(results[scale].totalDemographicStatusDistributionDuration / numRuns).toFixed(3)} ms`);
      console.log(`Average Inactivity Analysis Duration: ${(results[scale].totalInactivityAnalysisDuration / numRuns).toFixed(3)} ms`);
    }

    await User.deleteMany({});
    await mongoose.disconnect();
    console.log('MongoDB disconnected successfully.');
  } catch (error) {
    console.error('An error occurred during the tests:', error);
  }
}

runTests();