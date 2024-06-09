const performanceNow = require('performance-now');

async function testWritePerformance(testData, client) {
  const start = performanceNow();

  // Adjusted SQL insert command to be more resilient in CockroachDB environment
  const insertQuery = `
    INSERT INTO users (name, email, age, created_at, last_login, status, country)
    VALUES ${testData.map(data => `('${data.name}', '${data.email}', ${data.age}, '${data.createdAt}', '${data.lastLogin}', '${data.status}', '${data.country}')`).join(',')}
  `;

  await client.query(insertQuery);
  const end = performanceNow();
  const duration = (end - start).toFixed(3);
  return duration;
}

module.exports = testWritePerformance;
