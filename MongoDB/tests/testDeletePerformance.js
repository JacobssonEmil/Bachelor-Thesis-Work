const performanceNow = require('performance-now');
const User = require('../models/User');

async function testDeletePerformance(email) {
  const start = performanceNow();
  await User.findOneAndDelete({ email: email });;
  const end = performanceNow();
  const duration = (end - start).toFixed(3);
  return duration;
}

module.exports = testDeletePerformance;
