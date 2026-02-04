const request = require('supertest');
const { app, db, cleanDatabase } = require('./setup');

const makeIngredient = (overrides = {}) => ({
  name: `Test Ingredient ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  inci_name: 'Test INCI Name',
  ingredient_type: 'emollient',
  ...overrides
});

afterAll(async () => {
  await cleanDatabase();
});

describe('Ingredients API', () => {

  describe('POST /api/ingredients', () => {
    afterAll(async () => { await cleanDatabase(); });

    it('should return 201 with created ingredient when valid name provided', async () => {
      const ingredient = makeIngredient();
      const res = await request(app).post('/api/ingredients').send(ingredient);

      expect(res.status).toBe(201);
      expect(res.body.name).toBe(ingredient.name);
      expect(res.body.id).toBeDefined();
    });

    it('should return 400 when name is missing', async () => {
      const res = await request(app).post('/api/ingredients').send({ inci_name: 'Test' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should set boolean defaults to false', async () => {
      const ingredient = makeIngredient();
      const res = await request(app).post('/api/ingredients').send(ingredient);

      expect(res.status).toBe(201);
      expect(res.body.is_humectant).toBe(false);
      expect(res.body.is_emollient).toBe(false);
      expect(res.body.is_occlusive).toBe(false);
      expect(res.body.is_moisturizing).toBe(false);
      expect(res.body.is_anhydrous).toBe(false);
    });

    it('should create ingredient with all optional fields', async () => {
      const ingredient = makeIngredient({
        is_humectant: true,
        ph_min: 4.0,
        ph_max: 6.5,
        solubility: 'water',
        max_usage_rate: 10.00,
        notes: 'Test notes'
      });
      const res = await request(app).post('/api/ingredients').send(ingredient);

      expect(res.status).toBe(201);
      expect(res.body.is_humectant).toBe(true);
      expect(res.body.solubility).toBe('water');
      expect(res.body.notes).toBe('Test notes');
    });
  });

  describe('GET /api/ingredients', () => {
    afterAll(async () => { await cleanDatabase(); });

    it('should return 404 when no ingredients exist', async () => {
      await cleanDatabase();
      const res = await request(app).get('/api/ingredients');

      expect(res.status).toBe(404);
    });

    it('should return 200 with array of ingredients', async () => {
      await request(app).post('/api/ingredients').send(makeIngredient());
      await request(app).post('/api/ingredients').send(makeIngredient());

      const res = await request(app).get('/api/ingredients');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /api/ingredients/:id', () => {
    afterAll(async () => { await cleanDatabase(); });

    it('should return 200 with ingredient for valid existing UUID', async () => {
      const created = await request(app).post('/api/ingredients').send(makeIngredient());
      const res = await request(app).get(`/api/ingredients/${created.body.id}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(created.body.id);
      expect(res.body.name).toBe(created.body.name);
    });

    it('should return 404 for valid UUID that does not exist', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app).get(`/api/ingredients/${fakeId}`);

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid UUID format', async () => {
      const res = await request(app).get('/api/ingredients/not-a-uuid');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid ID format');
    });
  });

  describe('PUT /api/ingredients/:id', () => {
    afterAll(async () => { await cleanDatabase(); });

    it('should return 200 with updated ingredient', async () => {
      const created = await request(app).post('/api/ingredients').send(makeIngredient());
      const res = await request(app)
        .put(`/api/ingredients/${created.body.id}`)
        .send({ name: 'Updated Name', inci_name: 'Updated INCI' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Name');
      expect(res.body.inci_name).toBe('Updated INCI');
    });

    it('should return 400 when name is missing', async () => {
      const created = await request(app).post('/api/ingredients').send(makeIngredient());
      const res = await request(app)
        .put(`/api/ingredients/${created.body.id}`)
        .send({ inci_name: 'No name provided' });

      expect(res.status).toBe(400);
    });

    it('should return 404 for valid UUID that does not exist', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .put(`/api/ingredients/${fakeId}`)
        .send({ name: 'Does not exist' });

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid UUID format', async () => {
      const res = await request(app)
        .put('/api/ingredients/bad-id')
        .send({ name: 'Invalid' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid ID format');
    });
  });

  describe('DELETE /api/ingredients/:id', () => {
    afterAll(async () => { await cleanDatabase(); });

    it('should return 200 with success message when deleted', async () => {
      const created = await request(app).post('/api/ingredients').send(makeIngredient());
      const res = await request(app).delete(`/api/ingredients/${created.body.id}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted successfully');
      expect(res.body.deleted.id).toBe(created.body.id);
    });

    it('should return 404 for valid UUID that does not exist', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app).delete(`/api/ingredients/${fakeId}`);

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid UUID format', async () => {
      const res = await request(app).delete('/api/ingredients/bad-id');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid ID format');
    });

    it('should return 400 when ingredient is used in a formulation (foreign key)', async () => {
      // Create ingredient
      const ingredient = await request(app).post('/api/ingredients').send(makeIngredient());

      // Create formulation using that ingredient
      await request(app).post('/api/formulations').send({
        name: `FK Test Formulation ${Date.now()}`,
        base_batch_size: 100,
        ingredients: [{ ingredient_id: ingredient.body.id, percentage: 50, phase: 'A' }]
      });

      // Try to delete the ingredient — should fail
      const res = await request(app).delete(`/api/ingredients/${ingredient.body.id}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('used in formulations');
    });
  });
});
