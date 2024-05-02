const performanceNow = require('performance-now');

async function testUpdatePerformance(userData, client) {
    const start = performanceNow();
    // Example update operation, using parameters to avoid SQL injection
    await client.query('UPDATE users SET email = $1 WHERE email = $2', [userData.newEmail, userData.originalEmail]);
    const end = performanceNow();
    const duration = (end - start).toFixed(3);
    return duration;
}

module.exports = testUpdatePerformance;
