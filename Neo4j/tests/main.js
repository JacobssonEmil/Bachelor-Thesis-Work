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

async function warmUpDatabase() {
    console.log('Warming up database...');
    const currentEntries = 100; // Adjust the number of entries for warm-up
    const testData = await generateTestData(driver, currentEntries);

    // Insert initial test data multiple times to increase volume
    for (let i = 0; i < 3; i++) {
        await testWritePerformance(driver, testData.map(user => ({ ...user, email: `warmup${i}${user.email}` })));
    }

    // Perform comprehensive read operations
    await testReadPerformance(driver); // Read all documents to warm up the read path

    // Update operations to warm up the write path
    await testUpdatePerformance(driver, { originalEmail: "warmup1user0@example.com", newEmail: "updated_warmup1user0@example.com" });

    // Delete operation to include cleanup tasks in warm-up
    await testDeletePerformance(driver, "warmup2user0@example.com"); // Delete entries from the last insertion round
    await clearDatabase(driver);
    console.log('Warm-up phase completed.');
}

async function runTests() {
    try {
        console.log("Connected to Neo4j");
        await clearDatabase(driver);

        // Warm-up phase
        await warmUpDatabase();

        // Scale the workload
        const scales = [100, 1000, 10000, 100000, 1000000]; // Different scales to test
        for (const scale of scales) {
            console.log(`\n\nTesting with ${scale} records...`);
            await clearDatabase(driver);

            // Generate test data
            const testData = await generateTestData(driver, scale);

            // Test CRUD Performance
            const writeDuration = await testWritePerformance(driver, testData);
            console.log(`Write Duration for ${scale} records: ${writeDuration} ms`);
            
            const points = [Math.floor(scale / 1.5), Math.floor(scale / 2), Math.floor(scale / 3)]; // 67%, 50%, and 33% marks
            let totalReadDuration = 0;
            let totalUpdateDuration = 0;
            let totalDeleteDuration = 0;

            for (const point of points) {
                const sampleUser = testData[point];
                
                const readDuration = await testReadPerformance(driver, point);
                totalReadDuration += parseFloat(readDuration);
                
                const updateDuration = await testUpdatePerformance(driver, { originalEmail: sampleUser.email, newEmail: `updated_${sampleUser.email}` }, point);
                totalUpdateDuration += parseFloat(updateDuration);
                
                const deleteDuration = await testDeletePerformance(driver, sampleUser.email);
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
            await testUserRetentionAnalysisPerformance(driver);
            await testDemographicStatusDistributionPerformance(driver);
            await testInactivityAnalysisPerformance(driver);
        }

    } catch (error) {
        console.error(error);
    } finally {
        await clearDatabase(driver);
        await driver.close();
        console.log('Disconnected from Neo4j.');
    }
}

runTests();