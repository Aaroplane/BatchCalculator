# Batch Calculator

A REST API for cosmetic formulators to manage ingredients, build formulations (recipes), and scale production batches with precise ingredient calculations.

Designed for skincare, haircare, and personal care product development — from small-batch testing to scaled production runs.

## What It Does

- **Ingredient library** — Store ingredients with INCI names, property flags (humectant, emollient, occlusive), pH ranges, max usage rates, and solubility data
- **Formulation builder** — Create recipes with ingredients assigned to phases (A, B, C) at specific percentages
- **Batch scaling** — Calculate exact ingredient amounts for any target batch size based on a formulation's percentages
- **Production tracking** — Record planned vs. actual amounts weighed during production, with automatic variance calculation
- **Status workflow** — Formulations move through `testing` → `finalized` → `freeze` → `archived` → `discontinued`. Only finalized/freeze/archived formulations can produce batches

## Tech Stack

| Layer     | Technology                  |
|-----------|-----------------------------|
| Runtime   | Node.js                     |
| Framework | Express 5                   |
| Database  | PostgreSQL                  |
| ORM       | pg-promise                  |
| Testing   | Jest + Supertest            |
| Dev       | Nodemon (auto-reload)       |

## Prerequisites

- **Node.js** (v18+)
- **PostgreSQL** (v14+) running locally
- **psql** CLI available in your PATH

## Setup

```bash
# Clone the repository
git clone <repo-url>
cd BatchCalculatorProject/BC-Backend

# Install dependencies
npm install

# Create database and seed with sample data
npm run dbsetup

# Start the development server
npm start
```

The server runs on `http://localhost:3000` by default.

### Environment

Create a `.env` file in `BC-Backend/` with your database connection:

```
PORT=3000
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=batch_calculator_db
PG_USER=<your_pg_user>
```

### Database Scripts

| Command              | Description                                      |
|----------------------|--------------------------------------------------|
| `npm run dbinit`     | Drop and recreate the database with full schema   |
| `npm run dbseed`     | Seed the database with sample cosmetic data       |
| `npm run dbsetup`    | Run both init and seed in sequence                |
| `npm run db:test:setup` | Create a separate test database                |

## Project Structure

```
BC-Backend/
  server.js              # Express app setup, CORS, route mounting
  db/
    dbConfig.js          # pg-promise connection
    schema.sql           # Full database schema (CREATE DATABASE + tables)
    tables.sql           # Table definitions only (used by test setup)
    seed.sql             # Sample ingredients, formulations, and batches
  Routes/
    routes.js            # All API route definitions
  controllers/
    ingredientsController.js
    formulationsController.js
    productionBatchesController.js
  Queries/
    ingredientsQueries.js
    formulationsQueries.js
    productionBatchesQueries.js
  middleware/
    validate.js          # UUID validation middleware
  __tests__/
    setup.js             # Test environment config
    ingredients.test.js
    formulations.test.js
    batches.test.js
```

## API Endpoints

### Ingredients

| Method | Endpoint                | Description              |
|--------|-------------------------|--------------------------|
| GET    | `/api/ingredients`      | List all ingredients     |
| GET    | `/api/ingredients/:id`  | Get ingredient by ID     |
| POST   | `/api/ingredients`      | Create a new ingredient  |
| PUT    | `/api/ingredients/:id`  | Update an ingredient     |
| DELETE | `/api/ingredients/:id`  | Delete an ingredient     |

**POST/PUT body:**
```json
{
  "name": "Jojoba Oil",
  "inci_name": "Simmondsia Chinensis Seed Oil",
  "ingredient_type": "emollient",
  "is_humectant": false,
  "is_emollient": true,
  "is_occlusive": false,
  "is_moisturizing": true,
  "is_anhydrous": true,
  "ph_min": null,
  "ph_max": null,
  "solubility": "oil",
  "max_usage_rate": 100.00,
  "notes": "Lightweight carrier oil, good for all skin types"
}
```

### Formulations

| Method | Endpoint                                          | Description                          |
|--------|---------------------------------------------------|--------------------------------------|
| GET    | `/api/formulations`                               | List all formulations                |
| GET    | `/api/formulations?ingredient_id=<uuid>`          | Filter by ingredient                 |
| GET    | `/api/formulations?ingredient_ids=<uuid>,<uuid>`  | Filter by multiple ingredients (OR)  |
| GET    | `/api/formulations/:id`                           | Get formulation with ingredients     |
| POST   | `/api/formulations`                               | Create formulation with ingredients  |
| PUT    | `/api/formulations/:id`                           | Update formulation metadata          |
| DELETE | `/api/formulations/:id`                           | Delete formulation (cascades)        |
| POST   | `/api/formulations/:id/ingredients`               | Add ingredient to formulation        |
| DELETE | `/api/formulations/:id/ingredients/:ingredientId` | Remove ingredient from formulation   |

**POST body (create):**
```json
{
  "name": "Basic Face Moisturizer",
  "base_batch_size": 100,
  "status": "testing",
  "ingredients": [
    { "ingredient_id": "<uuid>", "percentage": 65.00, "phase": "A" },
    { "ingredient_id": "<uuid>", "percentage": 10.00, "phase": "A" },
    { "ingredient_id": "<uuid>", "percentage": 25.00, "phase": "B" }
  ]
}
```

### Production Batches

| Method | Endpoint                                        | Description                             |
|--------|-------------------------------------------------|-----------------------------------------|
| GET    | `/api/formulations/:id/calculate?batch_size=250`| Preview scaled amounts (no record saved)|
| POST   | `/api/batches`                                  | Create a production batch               |
| GET    | `/api/batches`                                  | List all batches                        |
| GET    | `/api/batches/:id`                              | Get batch with ingredients and variance |
| PUT    | `/api/batches/:id/actuals`                      | Record actual weighed amounts           |
| DELETE | `/api/batches/:id`                              | Delete a batch (cascades)               |

**POST body (create batch):**
```json
{
  "formulation_id": "<uuid>",
  "target_amount": 250,
  "batch_name": "March Production Run #1"
}
```

**PUT body (record actuals):**
```json
{
  "actual_total": 251.2,
  "notes": "Slightly over on water phase",
  "ingredients": [
    { "batch_ingredient_id": "<uuid>", "actual_amount": 163.5, "notes": "On target" },
    { "batch_ingredient_id": "<uuid>", "actual_amount": 87.7, "notes": "Slightly over" }
  ]
}
```

The calculate endpoint returns a preview without saving anything — useful for planning before committing to a batch:

```json
{
  "formulation_id": "<uuid>",
  "formulation_name": "Basic Face Moisturizer",
  "target_batch_size": 250,
  "scale_factor": 2.5,
  "ingredients": [
    { "ingredient_id": "<uuid>", "name": "Water", "percentage": 65, "planned_amount": 162.5 },
    { "ingredient_id": "<uuid>", "name": "Glycerin", "percentage": 10, "planned_amount": 25.0 }
  ]
}
```

## Database Schema

Five tables with UUID primary keys:

- **ingredients** — Raw materials with properties and metadata
- **formulations** — Recipes with status tracking and versioning
- **formulation_ingredients** — Junction table linking ingredients to formulations (percentage, phase)
- **production_batches** — Scaled batches tied to a formulation, with target and actual amounts
- **batch_ingredients** — Per-ingredient planned and actual amounts for each batch

Key constraints:
- Deleting a formulation cascades to its formulation_ingredients
- Deleting an ingredient is restricted if it's used in any formulation
- Deleting a batch cascades to its batch_ingredients
- Percentages must be between 0 and 100
- Batch sizes and amounts must be positive

## Testing

```bash
# Set up the test database (once)
npm run db:test:setup

# Run all tests
npm test

# Run with individual test names
npm run test:verbose
```

Tests use a separate `batch_calculator_test_db` database so your development data is never affected. The suite covers all 18 endpoints with 67 tests across ingredients, formulations, and batches.

## For Formulators

This API is the backend for managing your product development workflow:

1. **Build your ingredient library** — Add each raw material once with its INCI name, type, property flags, and usage limits. This becomes your reference database.

2. **Create formulations** — Combine ingredients at specific percentages, organized by phase (water phase, oil phase, cool-down phase). Start in `testing` status while iterating.

3. **Finalize when ready** — Update the formulation status to `finalized` when the formula is production-ready. Only finalized formulations can produce batches.

4. **Scale to any size** — Use the calculate endpoint to preview exact gram amounts for any batch size. The API handles the math — just weigh what it tells you.

5. **Track production** — Create a batch record, then update it with actual weighed amounts after production. The API calculates variance between planned and actual so you can monitor consistency.

## License

ISC
