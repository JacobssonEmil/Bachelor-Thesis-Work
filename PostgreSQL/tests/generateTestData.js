function generateTestData(n) {
    let testData = [];
    for (let i = 0; i < n; i++) {
      testData.push({
        name: `User${i}`,
        email: `user${i}@example.com`,
        age: Math.floor(Math.random() * 100)
      });
    }
    return testData;
  }
  
  module.exports = generateTestData;