const express = require('express');
    const app = express();
    const port = process.env.PORT || 3001; // Use the provided PORT or default to 3000
    const db = require('./db')

    app.get('/', async (req, res) => {
    try {
        console.log("Connecting to database...");
        const result = await db.query('SELECT NOW()');
        res.send('Hello from BioCraft Studio Backend! Database connection successful. Current time is: ' + result.rows[0].now);
      } catch (error) {
        console.error(error);
        res.status(500).send('Error connecting to database');
      }
    });

    app.listen(port, () => {
      console.log(`BioCraft Studio Backend listening at http://localhost:${port}`);
    });


