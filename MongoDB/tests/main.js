const os = require('os');
const mongoose = require('mongoose');
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
const User = require('../models/User');

async function warmUpDatabase(testData) {
  // Insert initial test data multiple times to increase volume
  for (let i = 0; i < 3; i++) {
      await User.insertMany(testData.map(user => ({...user, email: `warmup${i}${user.email}`})));
  }

  // Perform comprehensive read operations
  await User.find({});  // Read all documents to warm up the read path
  await User.find({ age: { $gt: 30 } });  // Query with a condition
  await User.aggregate([{ $group: { _id: "$country", count: { $sum: 1 } } }]);  // Aggregation to warm up more complex query paths

  // Update operations to warm up the write path
  await User.updateMany({ age: { $lt: 50 } }, { $set: { last_login: new Date() } });
  await User.updateMany({ age: { $gte: 50 } }, { $set: { last_login: new Date(), status: 'active' } });

  // Delete operation to include cleanup tasks in warm-up
  await User.deleteMany({ email: /warmup2/ });  // Delete entries from the last insertion round

  console.log('Warm-up phase completed.');
}

async function simulateUserRequests(threads) {
  const currentEntries = 100;
  const testData = await generateTestData(currentEntries);
  console.log(`\n----- Simulating user requests with ${threads} threads -----`);

  await User.deleteMany({});

  const writePromises = [];
  const readPromises = [];
  const updatePromises = [];
  const deletePromises = [];

  for (let i = 0; i < threads; i++) {
    writePromises.push(testWritePerformance(testData, i));
    readPromises.push(testReadPerformance(currentEntries, i));
    updatePromises.push(testUpdatePerformance({ originalEmail: `user${currentEntries / 2}@example.com`, newEmail: `updated@example.com` }, currentEntries));
    deletePromises.push(testDeletePerformance('updated@example.com', currentEntries));
    await User.deleteMany({});
  }

  const writeDurations = await Promise.all(writePromises).then(durations => durations.map(parseFloat));
  const readDurations = await Promise.all(readPromises).then(durations => durations.map(parseFloat));
  const updateDurations = await Promise.all(updatePromises).then(durations => durations.map(parseFloat));
  const deleteDurations = await Promise.all(deletePromises).then(durations => durations.map(parseFloat));

  const getAverageDuration = (durations) => {
    if (durations.length === 0) return 0; // Handle empty durations array
    const sum = durations.reduce((acc, curr) => acc + curr, 0);
    return sum / durations.length;
  };

  const averageWriteDuration = getAverageDuration(writeDurations);
  const averageReadDuration = getAverageDuration(readDurations);
  const averageUpdateDuration = getAverageDuration(updateDurations);
  const averageDeleteDuration = getAverageDuration(deleteDurations);

  console.log(`Average Write Operation Duration: ${averageWriteDuration.toFixed(3)} ms`);
  console.log(`Average Read Operation Duration: ${averageReadDuration.toFixed(3)} ms`);
  console.log(`Average Update Operation Duration: ${averageUpdateDuration.toFixed(3)} ms`);
  console.log(`Average Delete Operation Duration: ${averageDeleteDuration.toFixed(3)} ms`);

  console.log(`\n---------------------------------------------------------------`);
  return [averageWriteDuration, averageReadDuration, averageUpdateDuration, averageDeleteDuration];
}

async function runComplexQueryTests() {
  const currentEntries = 10000;
  const testData = await generateTestData(currentEntries);
  await User.insertMany(testData)
  console.log('\nStarting complex query tests...');
  await testUserRetentionAnalysisPerformance();
  await testDemographicStatusDistributionPerformance();
  await testInactivityAnalysisPerformance();
  console.log('Complex query tests completed.');
  await User.deleteMany({});
}

async function main() {
  await mongoose.connect('mongodb://localhost:27017/testdb', { useNewUrlParser: true, useUnifiedTopology: true });
  console.log("Connected to MongoDB");
  const currentEntries = 10000;
  const testData = await generateTestData(currentEntries);

  const numCPUs = os.cpus().length;
  const maxThreads = numCPUs > 1 ? numCPUs - 1 : 1;

  const averageDurationsByThreads = [];

   // Warm-up phase: perform some operations to "warm up" the database
   console.log('Starting warm-up phase...');
   await warmUpDatabase(testData);
 
   // Clear the collection after warm-up
   await User.deleteMany({});
  
  for (let threads = 1; threads <= maxThreads; threads++) {
    const averageDurations = await simulateUserRequests(threads);
    averageDurationsByThreads.push(averageDurations);
  }

  console.log("\nUser requests simulation completed.");

  // Calculate overall average durations
  const totalAverageDurations = averageDurationsByThreads.reduce((acc, curr) => {
    return acc.map((value, index) => value + curr[index]);
  }, [0, 0, 0, 0]);

  const overallAverageDurations = totalAverageDurations.map(value => value / maxThreads);

  console.log(`\nOverall Average Write Operation Duration: ${overallAverageDurations[0].toFixed(3)} ms`);
  console.log(`Overall Average Read Operation Duration: ${overallAverageDurations[1].toFixed(3)} ms`);
  console.log(`Overall Average Update Operation Duration: ${overallAverageDurations[2].toFixed(3)} ms`);
  console.log(`Overall Average Delete Operation Duration: ${overallAverageDurations[3].toFixed(3)} ms`);
  await runComplexQueryTests()

  await mongoose.connection.close();
}

main().catch(error => console.error(error));