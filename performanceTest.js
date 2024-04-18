const performanceNow = require('performance-now');
const mongoose = require('mongoose');
const User = require('./User');
require('./db'); // Importerar MongoDB anslutningen

const amountOfEntries = 10000

// Funktion för att generera testdata
async function generateTestData(n) {
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

// Funktion för att testa skrivoperationer
async function testWritePerformance(testData) {
  console.log(testData);
  const start = performanceNow();
  await User.insertMany(testData);
  const end = performanceNow();
  const totalTime = (end - start).toFixed(3)
  console.log(`Skrivoperationen tog: ${totalTime} ms`);
  const writeThroughput = (amountOfEntries / totalTime).toFixed(3);
  console.log(`Genomströmning för Skriv: ${writeThroughput} operationer per ms`);
}

// Funktion för att testa läsoperationer
async function testReadPerformance() {
  const start = performanceNow();
  await User.find({});
  const end = performanceNow();
  const totalTime = (end - start).toFixed(3)
  console.log(`Läsoperationen tog: ${totalTime} ms`);
  const readThroughput = (amountOfEntries / totalTime).toFixed(3);
  console.log(`Genomströmning för Läs: ${readThroughput} operationer per ms`);
}

async function main() {
  // Generera testdata
  const testData = await generateTestData(amountOfEntries);
  console.log(`Kör tester med: ${amountOfEntries} entries`)

  // Rensa tidigare testdata
  await User.deleteMany({});

  await testWritePerformance(testData);

  await testReadPerformance();

  // Städa upp: ta bort testdata
  await User.deleteMany({});

  // Stäng anslutningen till databasen
  await mongoose.connection.close();
}

main().then(() => process.exit(0));
