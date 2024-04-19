const performanceNow = require('performance-now');
const User = require('../models/User');

async function testDeletePerformance(email, amountOfEntries) {
  const start = performanceNow();
  await User.findOneAndDelete({ email: email });;
  const end = performanceNow();
  const duration = (end - start).toFixed(3);
  console.log(`Delete operation for ${amountOfEntries} entries took: ${duration} ms`);
}

module.exports = testDeletePerformance;
