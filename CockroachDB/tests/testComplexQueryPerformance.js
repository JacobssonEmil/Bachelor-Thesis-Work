const performanceNow = require('performance-now');

// Test User Retention Analysis Query Performance
async function testUserRetentionAnalysisPerformance(client) {
  const start = performanceNow();

  // Updated SQL query to perform user retention analysis for CockroachDB
  const userRetentionQuery = `
    SELECT
      TO_CHAR(created_at, 'YYYY-MM') AS signup_month,
      COUNT(*) AS total_users,
      SUM(CASE WHEN last_login >= NOW()::DATE - INTERVAL '1 month' THEN 1 ELSE 0 END) AS active_last_month
    FROM users
    GROUP BY signup_month
    ORDER BY signup_month DESC;
  `;

  await client.query(userRetentionQuery);
  const end = performanceNow();
  const duration = (end - start).toFixed(3);
  return duration;
}

// Test Demographic and Status Distribution Query Performance
async function testDemographicStatusDistributionPerformance(client) {
  const start = performanceNow();

  // Updated SQL query for demographic and status distribution analysis
  const demographicQuery = `
    SELECT
      country,
      status,
      AVG(age) AS average_age,
      COUNT(*) AS user_count
    FROM users
    WHERE status IN ('active', 'suspended')
    GROUP BY country, status
    ORDER BY country ASC, user_count DESC;
  `;

  await client.query(demographicQuery);
  const end = performanceNow();
  const duration = (end - start).toFixed(3);
  return duration;
}

// Test Inactivity Analysis for Potential Account Cleanup Performance
async function testInactivityAnalysisPerformance(client) {
  const start = performanceNow();

  // Updated SQL query to perform inactivity analysis
  const inactivityQuery = `
    SELECT
      name,
      email,
      DATE_PART('day', NOW()::DATE) - DATE_PART('day', last_login::DATE) AS days_inactive
    FROM users
    WHERE status = 'active' AND last_login < NOW() - INTERVAL '180 days'
    ORDER BY days_inactive DESC
    LIMIT 100;
  `;

  await client.query(inactivityQuery);
  const end = performanceNow();
  const duration = (end - start).toFixed(3);
  return duration;
}

module.exports = {
  testDemographicStatusDistributionPerformance,
  testInactivityAnalysisPerformance,
  testUserRetentionAnalysisPerformance
};
