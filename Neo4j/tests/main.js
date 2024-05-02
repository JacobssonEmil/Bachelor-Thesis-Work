const os = require('os');
const neo4j = require('neo4j-driver');
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

const uri = "bolt://localhost:7687";
const user = "neo4j";
const password = "12345678";

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

async function clearDatabase(driver) {
  const session = driver.session();
  try {
      await session.run('MATCH (n) DETACH DELETE n');
      console.log('Database cleared successfully.');
  } finally {
      await session.close();
  }
}


async function warmUpDatabase(testData) {
    // Insert initial test data multiple times to increase volume
    for (let i = 0; i < 3; i++) {
        await testWritePerformance(driver, testData.map(user => ({...user, email: `warmup${i}${user.email}`})));
    }

    // Perform comprehensive read operations
    await testReadPerformance(driver);  // Read all documents to warm up the read path

    // Update operations to warm up the write path
    await testUpdatePerformance(driver, { originalEmail: "warmup1user0@example.com", newEmail: "updated_warmup1user0@example.com" });

    // Delete operation to include cleanup tasks in warm-up
    await testDeletePerformance(driver, "warmup2user0@example.com");  // Delete entries from the last insertion round
    await clearDatabase(driver);
    console.log('Warm-up phase completed.');
}

async function runComplexQueryTests() {
    console.log('\nStarting complex query tests...');
    await clearDatabase(driver);
    await testUserRetentionAnalysisPerformance(driver);
    await testDemographicStatusDistributionPerformance(driver);
    await testInactivityAnalysisPerformance(driver);
    console.log('Complex query tests completed.');
}

async function simulateUserRequests(threads) {
    const currentEntries = 10000;
    const testData = await generateTestData(driver, currentEntries);
    console.log(`\n----- Simulating user requests with ${threads} threads -----`);

    await testWritePerformance(driver, testData);

    const averageDurations = {
        write: await testWritePerformance(driver, testData),
        read: await testReadPerformance(driver),
        update: await testUpdatePerformance(driver, { originalEmail: testData[0].email, newEmail: "updated_" + testData[0].email }),
        delete: await testDeletePerformance(driver, testData[0].email)
    };

    console.log(`\nAverage Write Operation Duration: ${averageDurations.write} ms`);
    console.log(`Average Read Operation Duration: ${averageDurations.read} ms`);
    console.log(`Average Update Operation Duration: ${averageDurations.update} ms`);
    console.log(`Average Delete Operation Duration: ${averageDurations.delete} ms`);

    

    //await driver.close();  // Close the driver at the end of simulation
}

async function main() {
    try {
        console.log("Connected to Neo4j");
        const numCPUs = os.cpus().length;
        const maxThreads = numCPUs > 1 ? numCPUs - 1 : 1;

        const currentEntries = 100;
        const testData = await generateTestData(driver, currentEntries);

        // Warm-up phase: perform some operations to "warm up" the database
        console.log('Starting warm-up phase...');
        await warmUpDatabase(testData);

        // Simulate user requests
        for (let threads = 1; threads <= maxThreads; threads++) {
            await simulateUserRequests(threads);
            await clearDatabase(driver);
            
        }
        console.log("\nUser requests simulation completed.");

        // Run complex queries as part of the simulation
        await runComplexQueryTests();
  
    } catch (error) {
        console.error(error);
    } finally {
        await clearDatabase(driver);
        await driver.close();
    }
}

main();
