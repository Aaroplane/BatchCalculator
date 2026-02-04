const request = require('supertest');
const { app, db, cleanDatabase } = require('./setup');

const makeIngredient = (overrides = {}) => ({
  name: `Ingredient ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  inci_name: 'Test INCI',
  ingredient_type: 'emollient',
  ...overrides
});

const makeFormulation = (ingredientIds, overrides = {}) => ({
  name: `Formulation ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  base_batch_size: 100,
  ingredients: ingredientIds.map((id, i) => ({
    ingredient_id: id,
    percentage: 30 + (i * 10),
    phase: 'A'
  })),
  ...overrides
});

// Shared test ingredients created once
let ingredientA, ingredientB, ingredientC;

beforeAll(async () => {
  await cleanDatabase();
  const resA = await request(app).post('/api/ingredients').send(makeIngredient({ name: 'FormTest Water' }));
  const resB = await request(app).post('/api/ingredients').send(makeIngredient({ name: 'FormTest Oil' }));
  const resC = await request(app).post('/api/ingredients').send(makeIngredient({ name: 'FormTest Emulsifier' }));
  ingredientA = resA.body;
  ingredientB = resB.body;
  ingredientC = resC.body;
});

afterAll(async () => {
  await cleanDatabase();
});

describe('Formulations API', () => {

  describe('POST /api/formulations', () => {
    afterAll(async () => {
      await db.none('TRUNCATE formulation_ingredients, formulations CASCADE');
    });

    it('should return 201 with complete formulation including ingredients', async () => {
      const formulation = makeFormulation([ingredientA.id, ingredientB.id]);
      const res = await request(app).post('/api/formulations').send(formulation);

      expect(res.status).toBe(201);
      expect(res.body.name).toBe(formulation.name);
      expect(res.body.ingredients).toBeDefined();
      expect(res.body.ingredients.length).toBe(2);
    });

    it('should return 400 when name is missing', async () => {
      const res = await request(app).post('/api/formulations').send({
        base_batch_size: 100,
        ingredients: [{ ingredient_id: ingredientA.id, percentage: 50 }]
      });

      expect(res.status).toBe(400);
    });

    it('should return 400 when base_batch_size is missing', async () => {
      const res = await request(app).post('/api/formulations').send({
        name: 'Missing batch size',
        ingredients: [{ ingredient_id: ingredientA.id, percentage: 50 }]
      });

      expect(res.status).toBe(400);
    });

    it('should return 400 when ingredients array is empty', async () => {
      const res = await request(app).post('/api/formulations').send({
        name: 'Empty ingredients',
        base_batch_size: 100,
        ingredients: []
      });

      expect(res.status).toBe(400);
    });

    it('should return 400 when ingredients is missing entirely', async () => {
      const res = await request(app).post('/api/formulations').send({
        name: 'No ingredients field',
        base_batch_size: 100
      });

      expect(res.status).toBe(400);
    });

    it('should return 400 when an ingredient_id does not exist in database', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000099';
      const res = await request(app).post('/api/formulations').send({
        name: 'Bad ingredient ref',
        base_batch_size: 100,
        ingredients: [{ ingredient_id: fakeId, percentage: 50 }]
      });

      expect(res.status).toBe(400);
      expect(res.body.missing_ingredient_id).toBe(fakeId);
    });

    it('should default status to testing', async () => {
      const formulation = makeFormulation([ingredientA.id]);
      const res = await request(app).post('/api/formulations').send(formulation);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('testing');
    });

    it('should default unit to g', async () => {
      const formulation = makeFormulation([ingredientA.id]);
      const res = await request(app).post('/api/formulations').send(formulation);

      expect(res.status).toBe(201);
      expect(res.body.unit).toBe('g');
    });
  });

  describe('GET /api/formulations', () => {
    let formulationWithA, formulationWithAB;

    beforeAll(async () => {
      await db.none('TRUNCATE formulation_ingredients, formulations CASCADE');

      const resA = await request(app).post('/api/formulations').send(
        makeFormulation([ingredientA.id], { name: 'Has Water Only' })
      );
      formulationWithA = resA.body;

      const resAB = await request(app).post('/api/formulations').send(
        makeFormulation([ingredientA.id, ingredientB.id], { name: 'Has Water and Oil' })
      );
      formulationWithAB = resAB.body;
    });

    afterAll(async () => {
      await db.none('TRUNCATE formulation_ingredients, formulations CASCADE');
    });

    it('should return 200 with array of all formulations', async () => {
      const res = await request(app).get('/api/formulations');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });

    it('should filter by single ingredient_id', async () => {
      const res = await request(app)
        .get(`/api/formulations?ingredient_id=${ingredientB.id}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe(formulationWithAB.id);
    });

    it('should filter by multiple ingredient_ids', async () => {
      const res = await request(app)
        .get(`/api/formulations?ingredient_ids=${ingredientA.id},${ingredientB.id}`);

      expect(res.status).toBe(200);
      // Both formulations contain ingredientA, one contains ingredientB — OR logic
      expect(res.body.length).toBe(2);
    });

    it('should return empty array when no formulations match filter', async () => {
      const res = await request(app)
        .get(`/api/formulations?ingredient_id=${ingredientC.id}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(0);
    });
  });

  describe('GET /api/formulations/:id', () => {
    afterAll(async () => {
      await db.none('TRUNCATE formulation_ingredients, formulations CASCADE');
    });

    it('should return 200 with formulation including nested ingredients', async () => {
      const created = await request(app).post('/api/formulations').send(
        makeFormulation([ingredientA.id, ingredientB.id])
      );
      const res = await request(app).get(`/api/formulations/${created.body.id}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(created.body.id);
      expect(res.body.ingredients).toBeDefined();
      expect(res.body.ingredients.length).toBe(2);
      expect(res.body.ingredients[0].ingredient_name).toBeDefined();
      expect(res.body.ingredients[0].percentage).toBeDefined();
    });

    it('should return 404 for non-existent UUID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app).get(`/api/formulations/${fakeId}`);

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid UUID format', async () => {
      const res = await request(app).get('/api/formulations/bad-id');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid ID format');
    });
  });

  describe('PUT /api/formulations/:id', () => {
    afterAll(async () => {
      await db.none('TRUNCATE formulation_ingredients, formulations CASCADE');
    });

    it('should return 200 with updated formulation', async () => {
      const created = await request(app).post('/api/formulations').send(
        makeFormulation([ingredientA.id])
      );
      const res = await request(app)
        .put(`/api/formulations/${created.body.id}`)
        .send({ name: 'Updated Formulation', base_batch_size: 200 });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Formulation');
      expect(parseFloat(res.body.base_batch_size)).toBe(200);
    });

    it('should return 400 when name is missing', async () => {
      const created = await request(app).post('/api/formulations').send(
        makeFormulation([ingredientA.id])
      );
      const res = await request(app)
        .put(`/api/formulations/${created.body.id}`)
        .send({ base_batch_size: 200 });

      expect(res.status).toBe(400);
    });

    it('should return 400 when base_batch_size is missing', async () => {
      const created = await request(app).post('/api/formulations').send(
        makeFormulation([ingredientA.id])
      );
      const res = await request(app)
        .put(`/api/formulations/${created.body.id}`)
        .send({ name: 'Missing size' });

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent UUID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .put(`/api/formulations/${fakeId}`)
        .send({ name: 'Nope', base_batch_size: 100 });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/formulations/:id', () => {
    it('should return 200 with success message', async () => {
      const created = await request(app).post('/api/formulations').send(
        makeFormulation([ingredientA.id])
      );
      const res = await request(app).delete(`/api/formulations/${created.body.id}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted successfully');
    });

    it('should return 404 for non-existent UUID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app).delete(`/api/formulations/${fakeId}`);

      expect(res.status).toBe(404);
    });

    it('should cascade delete formulation_ingredients', async () => {
      const created = await request(app).post('/api/formulations').send(
        makeFormulation([ingredientA.id, ingredientB.id])
      );

      await request(app).delete(`/api/formulations/${created.body.id}`);

      // Verify junction table rows are gone
      const remaining = await db.any(
        'SELECT * FROM formulation_ingredients WHERE formulation_id = $1',
        [created.body.id]
      );
      expect(remaining.length).toBe(0);
    });
  });

  describe('POST /api/formulations/:id/ingredients', () => {
    afterAll(async () => {
      await db.none('TRUNCATE formulation_ingredients, formulations CASCADE');
    });

    it('should return 201 when adding ingredient to formulation', async () => {
      const created = await request(app).post('/api/formulations').send(
        makeFormulation([ingredientA.id])
      );
      const res = await request(app)
        .post(`/api/formulations/${created.body.id}/ingredients`)
        .send({ ingredient_id: ingredientB.id, percentage: 15, phase: 'B' });

      expect(res.status).toBe(201);
      expect(res.body.ingredient_id).toBe(ingredientB.id);
    });

    it('should return 400 when ingredient_id is missing', async () => {
      const created = await request(app).post('/api/formulations').send(
        makeFormulation([ingredientA.id])
      );
      const res = await request(app)
        .post(`/api/formulations/${created.body.id}/ingredients`)
        .send({ percentage: 15 });

      expect(res.status).toBe(400);
    });

    it('should return 400 when percentage is missing', async () => {
      const created = await request(app).post('/api/formulations').send(
        makeFormulation([ingredientA.id])
      );
      const res = await request(app)
        .post(`/api/formulations/${created.body.id}/ingredients`)
        .send({ ingredient_id: ingredientB.id });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/formulations/:id/ingredients/:ingredientId', () => {
    afterAll(async () => {
      await db.none('TRUNCATE formulation_ingredients, formulations CASCADE');
    });

    it('should return 200 when removing ingredient from formulation', async () => {
      const created = await request(app).post('/api/formulations').send(
        makeFormulation([ingredientA.id, ingredientB.id])
      );
      const res = await request(app)
        .delete(`/api/formulations/${created.body.id}/ingredients/${ingredientB.id}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('removed');
    });

    it('should return 404 when ingredient is not in the formulation', async () => {
      const created = await request(app).post('/api/formulations').send(
        makeFormulation([ingredientA.id])
      );
      const res = await request(app)
        .delete(`/api/formulations/${created.body.id}/ingredients/${ingredientC.id}`);

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid ingredientId format', async () => {
      const created = await request(app).post('/api/formulations').send(
        makeFormulation([ingredientA.id])
      );
      const res = await request(app)
        .delete(`/api/formulations/${created.body.id}/ingredients/bad-id`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid ingredient ID format');
    });
  });
});
