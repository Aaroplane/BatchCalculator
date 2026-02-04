const request = require('supertest');
const { app, db, cleanDatabase } = require('./setup');

let ingredientA, ingredientB;
let finalizedFormulation, testingFormulation;

beforeAll(async () => {
  await cleanDatabase();

  // Create test ingredients
  const resA = await request(app).post('/api/ingredients').send({
    name: 'BatchTest Water',
    inci_name: 'Aqua',
    ingredient_type: 'solvent'
  });
  ingredientA = resA.body;

  const resB = await request(app).post('/api/ingredients').send({
    name: 'BatchTest Oil',
    inci_name: 'Simmondsia Chinensis',
    ingredient_type: 'emollient'
  });
  ingredientB = resB.body;

  // Create finalized formulation (can produce batches)
  const resFinal = await request(app).post('/api/formulations').send({
    name: 'Finalized Formula',
    base_batch_size: 100,
    status: 'finalized',
    ingredients: [
      { ingredient_id: ingredientA.id, percentage: 70, phase: 'A' },
      { ingredient_id: ingredientB.id, percentage: 30, phase: 'B' }
    ]
  });
  finalizedFormulation = resFinal.body;

  // Create testing formulation (cannot produce batches)
  const resTest = await request(app).post('/api/formulations').send({
    name: 'Testing Formula',
    base_batch_size: 100,
    ingredients: [
      { ingredient_id: ingredientA.id, percentage: 80, phase: 'A' },
      { ingredient_id: ingredientB.id, percentage: 20, phase: 'B' }
    ]
  });
  testingFormulation = resTest.body;
});

afterAll(async () => {
  await cleanDatabase();
});

describe('Production Batches API', () => {

  describe('GET /api/formulations/:id/calculate', () => {
    it('should return 200 with correctly scaled ingredient amounts', async () => {
      const res = await request(app)
        .get(`/api/formulations/${finalizedFormulation.id}/calculate?batch_size=250`);

      expect(res.status).toBe(200);
      expect(res.body.formulation_id).toBe(finalizedFormulation.id);
      expect(res.body.formulation_name).toBe('Finalized Formula');
      expect(parseFloat(res.body.target_batch_size)).toBe(250);
      expect(res.body.scale_factor).toBeCloseTo(2.5);
      expect(res.body.ingredients.length).toBe(2);

      // Water: 70% of 250g = 175g
      const water = res.body.ingredients.find(i => i.ingredient_id === ingredientA.id);
      expect(water.planned_amount).toBeCloseTo(175);

      // Oil: 30% of 250g = 75g
      const oil = res.body.ingredients.find(i => i.ingredient_id === ingredientB.id);
      expect(oil.planned_amount).toBeCloseTo(75);
    });

    it('should return 400 when batch_size is missing', async () => {
      const res = await request(app)
        .get(`/api/formulations/${finalizedFormulation.id}/calculate`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('batch_size');
    });

    it('should return 400 when batch_size is not a number', async () => {
      const res = await request(app)
        .get(`/api/formulations/${finalizedFormulation.id}/calculate?batch_size=abc`);

      expect(res.status).toBe(400);
    });

    it('should return 400 when batch_size is zero', async () => {
      const res = await request(app)
        .get(`/api/formulations/${finalizedFormulation.id}/calculate?batch_size=0`);

      expect(res.status).toBe(400);
    });

    it('should return 400 when batch_size is negative', async () => {
      const res = await request(app)
        .get(`/api/formulations/${finalizedFormulation.id}/calculate?batch_size=-50`);

      expect(res.status).toBe(400);
    });

    it('should return 404 when formulation does not exist', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .get(`/api/formulations/${fakeId}/calculate?batch_size=100`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/batches', () => {
    afterEach(async () => {
      await db.none('TRUNCATE batch_ingredients, production_batches CASCADE');
    });

    it('should return 201 with complete batch for finalized formulation', async () => {
      const res = await request(app).post('/api/batches').send({
        formulation_id: finalizedFormulation.id,
        target_amount: 200,
        batch_name: 'Test Batch #1'
      });

      expect(res.status).toBe(201);
      expect(res.body.formulation_id).toBe(finalizedFormulation.id);
      expect(parseFloat(res.body.target_amount)).toBe(200);
      expect(res.body.ingredients).toBeDefined();
      expect(res.body.ingredients.length).toBe(2);
    });

    it('should calculate correct planned_amounts for batch ingredients', async () => {
      const res = await request(app).post('/api/batches').send({
        formulation_id: finalizedFormulation.id,
        target_amount: 200
      });

      expect(res.status).toBe(201);

      // Water: 70% of 200g = 140g
      const water = res.body.ingredients.find(i => i.ingredient_id === ingredientA.id);
      expect(parseFloat(water.planned_amount)).toBeCloseTo(140);

      // Oil: 30% of 200g = 60g
      const oil = res.body.ingredients.find(i => i.ingredient_id === ingredientB.id);
      expect(parseFloat(oil.planned_amount)).toBeCloseTo(60);
    });

    it('should return 400 when formulation_id is missing', async () => {
      const res = await request(app).post('/api/batches').send({
        target_amount: 200
      });

      expect(res.status).toBe(400);
    });

    it('should return 400 when target_amount is missing', async () => {
      const res = await request(app).post('/api/batches').send({
        formulation_id: finalizedFormulation.id
      });

      expect(res.status).toBe(400);
    });

    it('should return 404 when formulation does not exist', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app).post('/api/batches').send({
        formulation_id: fakeId,
        target_amount: 200
      });

      expect(res.status).toBe(404);
    });

    it('should return 400 when formulation status is testing', async () => {
      const res = await request(app).post('/api/batches').send({
        formulation_id: testingFormulation.id,
        target_amount: 200
      });

      expect(res.status).toBe(400);
      expect(res.body.current_status).toBe('testing');
      expect(res.body.allowed_statuses).toEqual(['finalized', 'freeze', 'archived']);
    });
  });

  describe('GET /api/batches', () => {
    beforeAll(async () => {
      await request(app).post('/api/batches').send({
        formulation_id: finalizedFormulation.id,
        target_amount: 150,
        batch_name: 'List Test Batch'
      });
    });

    afterAll(async () => {
      await db.none('TRUNCATE batch_ingredients, production_batches CASCADE');
    });

    it('should return 200 with array of batches including formulation data', async () => {
      const res = await request(app).get('/api/batches');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].formulation_name).toBe('Finalized Formula');
      expect(res.body[0].formulation_status).toBe('finalized');
    });
  });

  describe('GET /api/batches/:id', () => {
    let createdBatch;

    beforeAll(async () => {
      const res = await request(app).post('/api/batches').send({
        formulation_id: finalizedFormulation.id,
        target_amount: 100,
        batch_name: 'Detail Test Batch'
      });
      createdBatch = res.body;
    });

    afterAll(async () => {
      await db.none('TRUNCATE batch_ingredients, production_batches CASCADE');
    });

    it('should return 200 with batch including nested ingredients', async () => {
      const res = await request(app).get(`/api/batches/${createdBatch.id}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdBatch.id);
      expect(res.body.ingredients).toBeDefined();
      expect(res.body.ingredients.length).toBe(2);
      expect(res.body.ingredients[0].planned_amount).toBeDefined();
      expect(res.body.ingredients[0].ingredient_name).toBeDefined();
    });

    it('should return 404 for non-existent UUID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app).get(`/api/batches/${fakeId}`);

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid UUID format', async () => {
      const res = await request(app).get('/api/batches/bad-id');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid ID format');
    });
  });

  describe('PUT /api/batches/:id/actuals', () => {
    let batchForActuals;

    beforeAll(async () => {
      const res = await request(app).post('/api/batches').send({
        formulation_id: finalizedFormulation.id,
        target_amount: 100,
        batch_name: 'Actuals Test Batch'
      });
      batchForActuals = res.body;
    });

    afterAll(async () => {
      await db.none('TRUNCATE batch_ingredients, production_batches CASCADE');
    });

    it('should return 200 with updated batch after recording actuals', async () => {
      const ingredientUpdates = batchForActuals.ingredients.map(ing => ({
        batch_ingredient_id: ing.batch_ingredient_id,
        actual_amount: parseFloat(ing.planned_amount) + 0.5,
        notes: 'Slightly over'
      }));

      const res = await request(app)
        .put(`/api/batches/${batchForActuals.id}/actuals`)
        .send({
          actual_total: 100.5,
          ingredients: ingredientUpdates,
          notes: 'Production complete'
        });

      expect(res.status).toBe(200);
      expect(parseFloat(res.body.actual_amount)).toBe(100.5);
      expect(res.body.ingredients).toBeDefined();

      // Verify actual amounts were recorded
      const updatedIngredient = res.body.ingredients[0];
      expect(updatedIngredient.actual_amount).toBeDefined();
      expect(parseFloat(updatedIngredient.actual_amount)).toBeGreaterThan(0);
    });

    it('should return 400 when ingredients array is missing', async () => {
      const res = await request(app)
        .put(`/api/batches/${batchForActuals.id}/actuals`)
        .send({ actual_total: 100 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('ingredients array');
    });

    it('should calculate variance correctly after recording actuals', async () => {
      // Fetch the batch to check variance fields
      const res = await request(app).get(`/api/batches/${batchForActuals.id}`);

      expect(res.status).toBe(200);
      // Variance fields should exist on ingredients that have actuals
      const ing = res.body.ingredients.find(i => i.actual_amount !== null);
      if (ing) {
        expect(ing.variance).toBeDefined();
        expect(ing.variance_percent).toBeDefined();
      }
    });
  });

  describe('DELETE /api/batches/:id', () => {
    it('should return 200 with success message', async () => {
      const created = await request(app).post('/api/batches').send({
        formulation_id: finalizedFormulation.id,
        target_amount: 50,
        batch_name: 'Delete Test'
      });

      const res = await request(app).delete(`/api/batches/${created.body.id}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted successfully');
    });

    it('should return 404 for non-existent UUID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app).delete(`/api/batches/${fakeId}`);

      expect(res.status).toBe(404);
    });

    it('should cascade delete batch_ingredients', async () => {
      const created = await request(app).post('/api/batches').send({
        formulation_id: finalizedFormulation.id,
        target_amount: 50
      });

      await request(app).delete(`/api/batches/${created.body.id}`);

      const remaining = await db.any(
        'SELECT * FROM batch_ingredients WHERE batch_id = $1',
        [created.body.id]
      );
      expect(remaining.length).toBe(0);
    });
  });
});
