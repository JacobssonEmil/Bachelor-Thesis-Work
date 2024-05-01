const neo4j = require('neo4j-driver');

async function generateTestData(driver, n) {
    const session = driver.session();
    const testData = [];
    const statuses = ['active', 'suspended', 'deleted'];
    const countries = ['USA', 'Canada', 'UK', 'Australia', 'Germany', 'France', 'Japan', 'Brazil', 'India', 'China'];

    for (let i = 0; i < n; i++) {
        const daysAgoCreated = Math.floor(Math.random() * 365 * 2); // up to two years ago
        const daysAgoLoggedIn = Math.floor(Math.random() * 90); // up to 90 days ago
        const createdAt = new Date(new Date().setDate(new Date().getDate() - daysAgoCreated));
        const lastLogin = new Date(new Date().setDate(new Date().getDate() - daysAgoLoggedIn));

        const user = {
            name: `User${i}`,
            email: `user${i}@example.com`,
            age: Math.floor(Math.random() * 100),
            createdAt: createdAt.toISOString(),
            lastLogin: lastLogin.toISOString(),
            status: statuses[Math.floor(Math.random() * statuses.length)],
            country: countries[Math.floor(Math.random() * countries.length)]
        };

        const query = `
            CREATE (u:User {
                name: $name,
                email: $email,
                age: $age,
                createdAt: $createdAt,
                lastLogin: $lastLogin,
                status: $status,
                country: $country
            })
        `;

        await session.run(query, user);
        testData.push(user);
    }

    await session.close();
    return testData;
}

module.exports = generateTestData;
