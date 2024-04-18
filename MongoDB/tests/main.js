const mongoose = require('mongoose');
require('../db');
const generateTestData = require('./generateTestData');
const testWritePerformance = require('./testWritePerformance');
const testReadPerformance = require('./testReadPerformance');
const testComplexQueryPerformance = require('./testComplexQueryPerformance');
const User = require('../models/User');

const testVolumes = [1000, 10000, 50000]; // Example data volumes for complex query testing

async function runScalabilityTests() {
  console.log("Starting scalability tests...\n");

  for(let factor = 1; factor <= 5; factor++) {
    const currentEntries = 1000 * factor;
    console.log(`\n----- Scalability Test with ${currentEntries} entries -----`);
    const testData = await generateTestData(currentEntries);
    await User.deleteMany({});
    await testWritePerformance(testData);
    await testReadPerformance(currentEntries);
  }
}

async function runComplexQueryTests() {
  console.log("\nStarting complex query performance tests...\n");

  for (const volume of testVolumes) {
    console.log(`\n----- Complex Query Test with ${volume} entries -----`);
    const testData = await generateTestData(volume);
    await User.deleteMany({});
    await User.insertMany(testData); // Ensure data is present for querying
    await testComplexQueryPerformance(); // This could be adjusted to pass volume if needed
  }
}

async function main() {
  await User.deleteMany({});
  await runScalabilityTests();
  await runComplexQueryTests();

  console.log("\nTests completed.");
  await User.deleteMany({});
  await mongoose.connection.close();
}

main().then(() => process.exit(0));
