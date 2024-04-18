const mongoose = require('mongoose');
require('../db');
const generateTestData = require('./generateTestData');
const testWritePerformance = require('./testWritePerformance');
const testReadPerformance = require('./testReadPerformance');
const testComplexQueryPerformance = require('./testComplexQueryPerformance');
const testReadResponseTime = require('./testReadResponseTimePerformance')
const testWriteResponseTime = require('./testWriteResponseTimePerformance')
const User = require('../models/User');

const testVolumes = [1000, 10000, 50000]; // Example data volumes for complex query testing

const userData = {
    name: 'Test User',
    email: 'testuser@example.com',
    age: 30
  };

async function runScalabilityTests() {
  console.log("Starting scalability tests...\n");
  console.log("\n         S C A L A B I L I T Y");
  console.log("----------------------------------------")

  for(let factor = 1; factor <= 5; factor++) {
    const currentEntries = 1000 * factor;
    console.log(`\n----- Scalability Test with ${currentEntries} entries -----`);
    const testData = await generateTestData(currentEntries);
    await User.deleteMany({});
    await testWritePerformance(testData);
    await testReadPerformance(currentEntries);
    console.log("\n---------------------------------------------------------------")
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
  //await runComplexQueryTests();

  
  await User.deleteMany({});
  console.log("\nRemoved all entries from datbase\n")

  // Run write latency test
  console.log("\n        R E S P O N S E  T I M E");
  console.log("----------------------------------------")
  await testWriteResponseTime(userData);
  await testReadResponseTime('testuser@example.com');

  console.log("\nTests completed.");
  await mongoose.connection.close();
}

main().then(() => process.exit(0));
