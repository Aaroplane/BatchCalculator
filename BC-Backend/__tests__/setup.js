// Load test environment BEFORE any app modules
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.test') });

// Now safe to require app modules — dbConfig.js will use PG_DATABASE=batch_calculator_test_db
const app = require('../server');
const db = require('../db/dbConfig');

// Truncate all tables in dependency-safe order
const cleanDatabase = async () => {
  await db.none('TRUNCATE batch_ingredients, production_batches, formulation_ingredients, formulations, ingredients CASCADE');
};

module.exports = { app, db, cleanDatabase };
