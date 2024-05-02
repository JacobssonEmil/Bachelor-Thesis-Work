const performanceNow = require('performance-now');
const User = require('../models/User');

async function testReadPerformance(n) {
  const start = performanceNow();
  await User.find({n});
  const end = performanceNow();
  const duration = (end - start).toFixed(3);
  return duration;
}

module.exports = testReadPerformance;