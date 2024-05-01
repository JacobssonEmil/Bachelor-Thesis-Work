const os = require('os');
const { VoltClient, VoltConfiguration, Query, ProcedureInvocation } = require('@voltdb/voltdb-client-node');
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
const setupDatabase = require('../models/User');

async function warmUpDatabase(testData, client) {
  for (let i = 0; i < 3; i++) {
    const currentEntries = 10000;
    const testData = await generateTestData(currentEntries);
    const insertProc = new ProcedureInvocation("User.Insert", testData.map(user => [user.name, user.email, user.age, user.createdAt, user.lastLogin, user.status, user.country]));
    await client.callProcedure(insertProc);
  }

  // Perform various queries
  await client.callProcedure(new ProcedureInvocation("SelectAll"));
  await client.callProcedure(new ProcedureInvocation("SelectByAge", [30]));
  await client.callProcedure(new ProcedureInvocation("GroupByCountry"));

  // Updates and deletes
  await client.callProcedure(new ProcedureInvocation("UpdateLastLogin", [50]));
  await client.callProcedure(new ProcedureInvocation("DeleteUsers"));

  console.log('Warm-up phase completed.');
}

async function simulateUserRequests(threads, client) {
  const currentEntries = 1000;
  const testData = await generateTestData(currentEntries);
  console.log(`\n----- Simulating user requests with ${threads} threads -----`);

  const writePromises = [];
  const readPromises = [];
  const updatePromises = [];
  const deletePromises = [];

  for (let i = 0; i < threads; i++) {
    writePromises.push(testWritePerformance(testData, client));
    readPromises.push(testReadPerformance(currentEntries, client));
    updatePromises.push(testUpdatePerformance({ originalEmail: `user${currentEntries / 2}@example.com`, newEmail: `updated@example.com` }, client));
    deletePromises.push(testDeletePerformance('updated@example.com', client));
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

async function runComplexQueryTests(client) {
  const currentEntries = 10000;
  const testData = await generateTestData(currentEntries);
  const values = testData.map(user => [user.email, user.name, user.age, user.country]);
  await client.query(`
  INSERT INTO users (name, email, age, created_at, last_login, status, country)
  VALUES ${testData.map(data => `('${data.name}', '${data.email}', ${data.age}, '${data.createdAt}', '${data.lastLogin}', '${data.status}', '${data.country}')`).join(',')}
`);
  console.log('\nStarting complex query tests...');
  await testUserRetentionAnalysisPerformance(client);
  await testDemographicStatusDistributionPerformance(client);
  await testInactivityAnalysisPerformance(client);
  console.log('Complex query tests completed.');
  await client.query('DELETE FROM users');
}

async function main() {
  const configurations = [new VoltConfiguration('hostname')];
  const client = new VoltClient(configurations);

  try {
    await client.connect();
    console.log('Connected to VoltDB');

    const User = await setupDatabase(client);
    console.log('User class has been defined');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
  
  console.log("Connected to VoltDB");
  const currentEntries = 10;
  const testData = await generateTestData(currentEntries);

  const numCPUs = os.cpus().length;
  const maxThreads = numCPUs > 1 ? numCPUs - 1 : 1;

  const averageDurationsByThreads = [];

  
  // Warm-up phase: perform some operations to "warm up" the database
  console.log('Starting warm-up phase...');
  await warmUpDatabase(testData, client);
  

  // Clear the table after warm-up
  await client.query('DELETE FROM users');

  for (let threads = 1; threads <= maxThreads; threads++) {
    const averageDurations = await simulateUserRequests(threads, client);
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
  
  await runComplexQueryTests(client);

  await client.end();
}

main().catch(error => console.error(error));
