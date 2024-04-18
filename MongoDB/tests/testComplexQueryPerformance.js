const performanceNow = require('performance-now');
const User = require('../models/User');

// This is an example of a complex query function. Adjust according to your needs.
async function testComplexQueryPerformance() {
  const start = performanceNow();
  
  // Example of a complex query: find users in a certain age range, sort by name, limit to 100 results.
  await User.find({ age: { $gte: 18, $lte: 65 } })
            .sort({ name: 1 })
            .limit(100);

  const end = performanceNow();
  const duration = (end - start).toFixed(3);
  console.log(`Complex query operation took: ${duration} ms`);
}

module.exports = testComplexQueryPerformance;
