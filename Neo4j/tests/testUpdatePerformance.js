const performanceNow = require('performance-now');
const neo4j = require('neo4j-driver');

async function testUpdatePerformance(driver, userData) {
    const session = driver.session();
    const start = performanceNow();

    const query = `
        MATCH (u:User {email: $originalEmail})
        SET u.email = $newEmail
    `;

    await session.run(query, { originalEmail: userData.originalEmail, newEmail: userData.newEmail });
    const end = performanceNow();
    const duration = (end - start).toFixed(3);

    await session.close();
    return duration;
}

module.exports = testUpdatePerformance;
