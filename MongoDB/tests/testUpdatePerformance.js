const performanceNow = require('performance-now');
const User = require('../models/User');

async function testUpdatePerformance(testData) {
  const start = performanceNow();
  await User.findOneAndUpdate({ email: userDataToUpdate.originalEmail }, { email: userDataToUpdate.newEmail });
  const end = performanceNow();
  const duration = (end - start).toFixed(3);
  console.log(`Update operation for ${testData.length} entries took: ${duration} ms`);
  console.log(`Update Throughput: ${(testData.length / duration).toFixed(3)} operations per ms`);
}

module.exports = testUpdatePerformance;
