const performanceNow = require('performance-now');
const neo4j = require('neo4j-driver');

async function testWritePerformance(driver, testData) {
    const session = driver.session();
    const start = performanceNow();

    const query = `
        UNWIND $testData AS userData
        CREATE (u:User {
            name: userData.name,
            email: userData.email,
            age: userData.age,
            createdAt: userData.createdAt,
            lastLogin: userData.lastLogin,
            status: userData.status,
            country: userData.country
        })
    `;

    await session.run(query, { testData });
    const end = performanceNow();
    const duration = (end - start).toFixed(3);

    await session.close();
    return duration;
}

module.exports = testWritePerformance;
