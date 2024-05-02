const performanceNow = require('performance-now');
const neo4j = require('neo4j-driver');

async function testReadPerformance(driver, id) {
    const session = driver.session();
    const email = `user${id}@example.com`; // Constructing the email with the given ID user${i}@example.com
    const start = performanceNow();

    const query = `
    MATCH (u:User {email: $email}) RETURN u
    `;

    await session.run(query, {email: email});

    const end = performanceNow();
    const duration = (end - start).toFixed(3);

    await session.close();
    return duration;
}

module.exports = testReadPerformance;
