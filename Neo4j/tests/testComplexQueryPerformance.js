const performanceNow = require('performance-now');
const neo4j = require('neo4j-driver');

// Test User Retention Analysis Query Performance
async function testUserRetentionAnalysisPerformance(driver) {
  const session = driver.session();
  const start = performanceNow();

  const query = `
  MATCH (u:User)
  WHERE u.createdAt IS NOT NULL AND u.lastLogin IS NOT NULL
  RETURN 
    date(datetime(u.createdAt)).year + '-' + date(datetime(u.createdAt)).month AS signup_month,
    CASE WHEN duration.inDays(date(datetime(u.lastLogin)), date()).days <= 30 THEN 1 ELSE 0 END AS active_last_month
  ORDER BY signup_month DESC
  
  `;

  await session.run(query);
  const end = performanceNow();

  await session.close();
  const duration = (end - start).toFixed(3);
  return duration;
}

// Test Demographic and Status Distribution Query Performance
async function testDemographicStatusDistributionPerformance(driver) {
  const session = driver.session();
  const start = performanceNow();

  const query = `
    MATCH (u:User)
    WHERE u.status IN ['active', 'suspended']
    RETURN 
      u.country AS country, 
      u.status AS status, 
      avg(u.age) AS average_age, 
      count(u) AS user_count
    ORDER BY country, user_count DESC
  `;

  await session.run(query);
  const end = performanceNow();
  

  await session.close();
  const duration = (end - start).toFixed(3);
  return duration;
}

// Test Inactivity Analysis for Potential Account Cleanup Performance
async function testInactivityAnalysisPerformance(driver) {
  const session = driver.session();
  const start = performanceNow();

  const query = `
  MATCH (u:User)
  WHERE u.status = 'active' AND duration.inMonths(datetime(u.lastLogin), datetime()).months > 6
  RETURN 
    u.name, 
    u.email, 
    duration.inDays(datetime(u.lastLogin), datetime()).days AS days_inactive
  ORDER BY days_inactive DESC
  LIMIT 100
  
  `;

  await session.run(query);
  const end = performanceNow();
  

  await session.close();
  const duration = (end - start).toFixed(3);
  return duration;
}

module.exports = {
  testDemographicStatusDistributionPerformance,
  testInactivityAnalysisPerformance,
  testUserRetentionAnalysisPerformance
};
