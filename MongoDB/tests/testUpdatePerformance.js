const performanceNow = require('performance-now');
const User = require('../models/User');

async function testUpdatePerformance(userData) {
  const start = performanceNow();
  await User.findOneAndUpdate({ email: userData.originalEmail }, { email: userData.newEmail });
  const end = performanceNow();
  const duration = (end - start).toFixed(3);
  return duration;
}

module.exports = testUpdatePerformance;
