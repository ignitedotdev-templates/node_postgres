const express = require('express');
const { Pool } = require('pg');
const { faker } = require('@faker-js/faker');
const cors = require('cors');  // Import the cors package

// Create an instance of express
const app = express();

// Apply the CORS middleware
app.use(cors());

// PostgreSQL connection configuration
const pool = new Pool({
    user: process.env.DB_USER || "",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "users",
    password: process.env.DB_PASSWORD || "",
    port: process.env.DB_PORT || "5432",
});

// Middleware to parse JSON bodies
app.use(express.json());

// Simple route to get user data
app.get('/', (req, res) => {
    console.log('Request received at /');
    return res.status(200).send({
        message: "hello"
    });
});

// Route to get a single user by ID
app.get('/user/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (result.rows.length) {
            res.json(result.rows[0]);
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) {
        res.status(500).send('Server Error');
        console.error(err);
    }
});

// Route to get all users
app.get('/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users');
        res.json(result.rows);
    } catch (err) {
        res.status(500).send('Server Error');
        console.error(err);
    }
});

app.post('/generate-users/:count', async (req, res) => {
    const numberOfUsers = req.params.count;
    const users = [];

    for (let i = 0; i < numberOfUsers; i++) {
        users.push({
            name: faker.person.fullName(),  // Use the updated method
            email: faker.internet.email(),
            age: faker.number.int({ min: 18, max: 99 }),
            created_at: new Date().toISOString()
        });
    }

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            for (const user of users) {
                await client.query(
                    'INSERT INTO users (name, email, age, created_at) VALUES ($1, $2, $3, $4)',
                    [user.name, user.email, user.age, user.created_at]
                );
            }
            await client.query('COMMIT');
            res.status(201).send('Users created');
        } catch (err) {
            await client.query('ROLLBACK');
            res.status(500).send('Server Error');
            console.error(err);
        } finally {
            client.release();
        }
    } catch (err) {
        res.status(500).send('Server Error');
        console.error(err);
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
