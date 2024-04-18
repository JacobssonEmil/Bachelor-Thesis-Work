// User.js
const { Client } = require('pg');

// Create a new PostgreSQL client instance
const client = new Client({
  connectionString: 'postgresql://postgres:1234@localhost:5432/postgres'
});

// Connect to the PostgreSQL database
client.connect()
  .then(() => console.log('Connected to PostgreSQL database'))
  .catch(err => console.error('Error connecting to PostgreSQL database', err));

// Define the user schema
const userSchema = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR,
  email VARCHAR,
  age INTEGER
);
`;

// Create the users table if it doesn't exist
client.query(userSchema)
  .then(() => console.log('Users table created successfully'))
  .catch(err => console.error('Error creating users table', err));

// Define the User model functions
const User = {
  insertMany: async function (data) {
    const insertQuery = 'INSERT INTO users (name, email, age) VALUES ($1, $2, $3)';
    try {
      await Promise.all(data.map(user => client.query(insertQuery, [user.name, user.email, user.age])));
      console.log(`Inserted ${data.length} users into PostgreSQL`);
    } catch (err) {
      console.error('Error inserting users into PostgreSQL', err);
    }
  },

  findOne: async function (filter) {
    const { email } = filter;
    const query = 'SELECT * FROM users WHERE email = $1';
    try {
      const result = await client.query(query, [email]);
      console.log('Found user:', result.rows[0]);
    } catch (err) {
      console.error('Error finding user in PostgreSQL', err);
    }
  },

  find: async function () {
    const query = 'SELECT * FROM users';
    try {
      const result = await client.query(query);
      console.log('Found users:', result.rows);
    } catch (err) {
      console.error('Error finding users in PostgreSQL', err);
    }
  },

  deleteMany: async function () {
    const query = 'DELETE FROM users';
    try {
      await client.query(query);
      console.log('Deleted all users from PostgreSQL');
    } catch (err) {
      console.error('Error deleting users from PostgreSQL', err);
    }
  }
};

module.exports = User;