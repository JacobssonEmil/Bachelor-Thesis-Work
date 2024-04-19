const performanceNow = require('performance-now');
const User = require('../models/User');

// Assuming userDataToUpdate is an object like { originalEmail: 'old@example.com', newEmail: 'new@example.com' }
async function testUpdateResponseTime(userData) {
    const start = performanceNow();
    // Find the user by the original email and update it with the new email
    await User.findOneAndUpdate({ email: userData.originalEmail }, { email: userData.newEmail });
    const end = performanceNow();
    const responseTime = (end - start).toFixed(3);
    console.log(`Update operation Response Time: ${responseTime} ms`);
}
module.exports = testUpdateResponseTime;