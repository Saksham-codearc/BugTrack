/* Starts the API with an in-memory MongoDB and demo data — no MongoDB install needed. */
process.env.USE_MEMORY_DB = 'true';
process.env.AUTO_SEED = 'true';

require('../src/server');
