const db = require('./db');

async function withTransaction(callback, retries = 3) {
    let client;
    let attempt = 0;

    while (attempt < retries) {
        try {
            client = await db.connect();

            // Test the connection
            await client.query('SELECT 1');

            await client.query('BEGIN');

            const result = await callback(client);

            await client.query('COMMIT');
            return result;

        } catch (err) {
            console.error(`Transaction attempt ${attempt + 1} failed:`, err.message);

            if (err.statusCode && err.statusCode < 500) {
            throw err; // don't retry client errors
        }
            if (client) {
                try {
                    await client.query('ROLLBACK');
                } catch (rollbackErr) {
                    console.error('Error during rollback:', rollbackErr.message);
                }
            }

            attempt++;

            // if (attempt >= retries) {
            // const wrapped = new Error(
            // `Transaction failed after ${retries} attempts: ${err.message}`
            // );

            // wrapped.statusCode = err.statusCode || 500;
            // throw wrapped;
            // }

            if (attempt >= retries) {
            throw err;
            }
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
        } finally {
            if (client) {
                client.release();
            }
        }
    }
}

module.exports = { withTransaction };