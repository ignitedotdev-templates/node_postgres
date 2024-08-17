const express = require('express');
const { Pool } = require('pg');

// Create an instance of express
const app = express();

// PostgreSQL connection configuration
const pool = new Pool({
    user: process.env.DB_USER || "",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "users",
    password: process.env.DB_PASSWORD|| "",
    port: process.env.DB_PORT|| "5432",
});


// Simple route to get user data
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

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
