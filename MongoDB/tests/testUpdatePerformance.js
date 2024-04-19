const performanceNow = require('performance-now');
const User = require('../models/User');

async function testUpdatePerformance(userData, amountOfEntries) {
  const start = performanceNow();
  await User.findOneAndUpdate({ email: userData.originalEmail }, { email: userData.newEmail });
  const end = performanceNow();
  const duration = (end - start).toFixed(3);
  console.log(`Update operation for ${amountOfEntries} entries took: ${duration} ms`);
}

module.exports = testUpdatePerformance;
