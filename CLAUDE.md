# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Batch Calculator is a Node.js/Express REST API for cosmetic product formulation management. It handles ingredients, formulations (recipes with ingredient percentages), and production batches (scaled calculations with variance tracking). The application code lives in `BC-Backend/`.

## Common Commands

All commands run from `BC-Backend/`:

```bash
cd BC-Backend
npm install              # Install dependencies
npm start                # Start dev server (Nodemon, port 3000)
npm test                 # Run all tests (Jest, separate test DB on port 3001)
npm run test:verbose     # Tests with detailed output
npm run dbsetup          # Initialize + seed database
npm run db:test:setup    # Create/reset the test database
```

Run a single test file:
```bash
npx jest --runInBand --forceExit __tests__/ingredients.test.js
```

Database scripts (require `psql` access as user `uwu`):
```bash
npm run dbinit           # Drop/recreate batch_calculator_db with full schema
npm run dbseed           # Load sample cosmetic ingredient/formula data
```

## Architecture

Three-layer MVC-style pattern: **Routes → Controllers → Queries → PostgreSQL**

- `Routes/routes.js` — Single file defining all 18 API endpoints. Each route chains validation middleware → asyncHandler → controller function.
- `controllers/` — Three controller files (ingredients, formulations, productionBatches) handle request/response logic. One controller per resource.
- `Queries/` — Three query files mirror the controllers. Use pg-promise (`db.any()`, `db.one()`, `db.oneOrNone()`, `db.tx()` for transactions). All queries are parameterized.
- `middleware/` — `validate.js` (UUID and positive number validation), `asyncHandler.js` (wraps async controllers for error forwarding), `errorHandler.js` (translates PostgreSQL error codes 23505/23503/23502 to proper HTTP status codes).
- `db/dbConfig.js` — pg-promise connection using environment variables from `.env` (dev) or `.env.test` (test).
- `db/schema.sql` — Full schema with 5 tables, indexes, and constraints. `db/tables.sql` is the test-only version (tables without DB creation).

## Database Schema (5 tables, all UUID primary keys)

- **ingredients** — Core ingredient data with boolean flags (humectant, emollient, etc.), unique constraint on (name, origin).
- **formulations** — Recipes with status workflow enum: `testing → finalized → freeze → archived → discontinued`. Only `finalized`/`freeze`/`archived` statuses allow batch creation.
- **formulation_ingredients** — Junction table linking ingredients to formulations with percentage (0-100), phase, and sort_order.
- **production_batches** — Scaled batches tied to a formulation with target/actual amounts.
- **batch_ingredients** — Planned/actual amounts per ingredient with auto-calculated `variance` and `variance_percent` columns.

Key constraints: deleting an ingredient used in a formulation is restricted (ON DELETE RESTRICT). Deleting a formulation cascades to its formulation_ingredients but is restricted if production batches exist.

## API Resources

Three resource groups: `/api/ingredients` (5 endpoints), `/api/formulations` (7 endpoints including ingredient management), `/api/batches` (5 endpoints). Batch calculation preview is at `GET /api/formulations/:id/calculate?batch_size=X`.

## Testing

Tests use a separate `batch_calculator_test_db` database (configured in `.env.test`). Run `npm run db:test:setup` before first test run. Tests use Supertest for HTTP assertions and truncate all tables between suites. Jest runs with `--runInBand` (serial) and `--forceExit`.

## Environment

Two env files (git-ignored): `.env` for development (port 3000, `batch_calculator_db`) and `.env.test` for testing (port 3001, `batch_calculator_test_db`). Required variables: `PORT`, `PG_HOST`, `PG_PORT`, `PG_DATABASE`, `PG_USER`.
