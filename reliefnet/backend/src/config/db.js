const {Pool} = require('pg')

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    // Connection pool settings for stability
    max: 20, // Maximum number of clients in the pool
    min: 2, // Minimum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    acquireTimeoutMillis: 60000, // Return an error after 60 seconds if a client could not be acquired
    // Keep connections alive
    keepAlive: true,
    keepAliveInitialDelayMillis: 0,
});

// Test connection on startup
pool.connect()
    .then(client =>{
        console.log('Connected to the database');
        client.release();
    })
    .catch(err => {
        console.error('Error occurred while connecting to the database:', err);
        process.exit(1); // Exit if we can't connect to DB
    });

// Handle pool errors
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
});

// Handle pool connection events
pool.on('connect', (client) => {
    console.log('New client connected to database');
});

pool.on('remove', (client) => {
    console.log('Client removed from pool');
});

module.exports = pool;
