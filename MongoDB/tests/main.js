const os = require('os');
const mongoose = require('mongoose');
const generateTestData = require('./generateTestData');
const testWritePerformance = require('./testWritePerformance');
const testReadPerformance = require('./testReadPerformance');
const testUpdatePerformance = require('./testUpdatePerformance');
const testDeletePerformance = require('./testDeletePerformance');
const User = require('../models/User');

async function simulateUserRequests(threads) {
  console.log(`\n----- Simulating user requests with ${threads} threads -----`);

  await User.deleteMany({});

  const currentEntries = 100;
  const testData = await generateTestData(currentEntries);

  // Simulate multiple users making requests concurrently
  const writePromises = [];
  const readPromises = [];
  const updatePromises = [];
  const deletePromises = [];

  for (let i = 0; i < threads; i++) {
    writePromises.push(testWritePerformance(testData, i));
    readPromises.push(testReadPerformance(currentEntries, i));
    updatePromises.push(testUpdatePerformance({ originalEmail: `user${currentEntries / 2}@example.com`, newEmail: `updated@example.com` }, currentEntries));
    deletePromises.push(testDeletePerformance('updated@example.com', currentEntries));
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

async function main() {
  await mongoose.connect('mongodb://localhost:27017/testdb', { useNewUrlParser: true, useUnifiedTopology: true });
  console.log("Connected to MongoDB");

  const numCPUs = os.cpus().length;
  const maxThreads = numCPUs > 1 ? numCPUs - 1 : 1;

  const averageDurationsByThreads = [];

  // Gradually increase the number of threads
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

  await mongoose.connection.close();
}

main().catch(error => console.error(error));
