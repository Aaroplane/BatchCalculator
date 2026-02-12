const request = require('supertest');
const { app, db, cleanDatabase } = require('./setup');

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeIngredient = (overrides = {}) => ({
  name: `ValTest Ingredient ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  inci_name: 'Test INCI',
  ingredient_type: 'emollient',
  ...overrides
});

const VALID_UUID = '00000000-0000-0000-0000-000000000001';

// Shared state populated in beforeAll
let ingredientA;
let finalizedFormulation;

beforeAll(async () => {
  await cleanDatabase();

  // Create a real ingredient for formulation / batch tests
  const resA = await request(app)
    .post('/api/ingredients')
    .send(makeIngredient({ name: 'ValTest Water' }));
  ingredientA = resA.body;

  // Create a finalized formulation so batch tests have a valid reference
  const resForm = await request(app)
    .post('/api/formulations')
    .send({
      name: 'ValTest Finalized Formula',
      base_batch_size: 100,
      status: 'finalized',
      ingredients: [
        { ingredient_id: ingredientA.id, percentage: 50, phase: 'A' }
      ]
    });
  finalizedFormulation = resForm.body;
});

afterAll(async () => {
  await cleanDatabase();
});

// ═════════════════════════════════════════════════════════════════════════════
// 1. INGREDIENT VALIDATION
// ═════════════════════════════════════════════════════════════════════════════

describe('Ingredient Validation', () => {

  describe('POST /api/ingredients — required fields', () => {
    it('should return 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/ingredients')
        .send({ inci_name: 'No Name' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 when name is an empty string', async () => {
      const res = await request(app)
        .post('/api/ingredients')
        .send({ name: '', inci_name: 'Empty Name' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('POST /api/ingredients — pH cross-field validation', () => {
    it('should return 400 when ph_min > ph_max', async () => {
      const res = await request(app)
        .post('/api/ingredients')
        .send(makeIngredient({ ph_min: 10, ph_max: 4 }));

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 when ph_min is below 0', async () => {
      const res = await request(app)
        .post('/api/ingredients')
        .send(makeIngredient({ ph_min: -1 }));

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 when ph_min is above 14', async () => {
      const res = await request(app)
        .post('/api/ingredients')
        .send(makeIngredient({ ph_min: 15 }));

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 when ph_max is below 0', async () => {
      const res = await request(app)
        .post('/api/ingredients')
        .send(makeIngredient({ ph_max: -1 }));

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 when ph_max is above 14', async () => {
      const res = await request(app)
        .post('/api/ingredients')
        .send(makeIngredient({ ph_max: 15 }));

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should accept equal ph_min and ph_max', async () => {
      const res = await request(app)
        .post('/api/ingredients')
        .send(makeIngredient({ ph_min: 7, ph_max: 7 }));

      expect(res.status).toBe(201);
    });
  });

  describe('POST /api/ingredients — max_usage_rate validation', () => {
    it('should return 400 when max_usage_rate is negative', async () => {
      const res = await request(app)
        .post('/api/ingredients')
        .send(makeIngredient({ max_usage_rate: -5 }));

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 when max_usage_rate is zero', async () => {
      const res = await request(app)
        .post('/api/ingredients')
        .send(makeIngredient({ max_usage_rate: 0 }));

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 when max_usage_rate exceeds 100', async () => {
      const res = await request(app)
        .post('/api/ingredients')
        .send(makeIngredient({ max_usage_rate: 101 }));

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should accept max_usage_rate of exactly 100', async () => {
      const res = await request(app)
        .post('/api/ingredients')
        .send(makeIngredient({ max_usage_rate: 100 }));

      expect(res.status).toBe(201);
    });
  });

  describe('POST /api/ingredients — boolean field validation', () => {
    it('should return 400 when is_humectant is a non-boolean string', async () => {
      const res = await request(app)
        .post('/api/ingredients')
        .send(makeIngredient({ is_humectant: 'yes' }));

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 when is_emollient is a non-boolean string', async () => {
      const res = await request(app)
        .post('/api/ingredients')
        .send(makeIngredient({ is_emollient: 'notabool' }));

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 when is_occlusive is a number', async () => {
      const res = await request(app)
        .post('/api/ingredients')
        .send(makeIngredient({ is_occlusive: 42 }));

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should accept boolean true/false for boolean fields', async () => {
      const res = await request(app)
        .post('/api/ingredients')
        .send(makeIngredient({
          is_humectant: true,
          is_emollient: false,
          is_occlusive: true,
          is_moisturizing: false,
          is_anhydrous: true
        }));

      expect(res.status).toBe(201);
      expect(res.body.is_humectant).toBe(true);
      expect(res.body.is_emollient).toBe(false);
    });
  });

  describe('POST /api/ingredients — valid ingredient with all fields', () => {
    it('should return 201 when all fields are valid', async () => {
      const res = await request(app)
        .post('/api/ingredients')
        .send(makeIngredient({
          inci_name: 'Full INCI',
          origin: 'Plant-derived',
          ingredient_type: 'humectant',
          is_humectant: true,
          is_emollient: false,
          is_occlusive: false,
          is_moisturizing: true,
          is_anhydrous: false,
          ph_min: 4.0,
          ph_max: 7.0,
          solubility: 'water',
          max_usage_rate: 25.5,
          notes: 'Full validation test'
        }));

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.solubility).toBe('water');
      expect(res.body.notes).toBe('Full validation test');
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. FORMULATION VALIDATION
// ═════════════════════════════════════════════════════════════════════════════

describe('Formulation Validation', () => {

  describe('POST /api/formulations — required fields', () => {
    it('should return 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/formulations')
        .send({
          base_batch_size: 100,
          ingredients: [{ ingredient_id: ingredientA.id, percentage: 50 }]
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 when base_batch_size is missing', async () => {
      const res = await request(app)
        .post('/api/formulations')
        .send({
          name: 'Missing batch size',
          ingredients: [{ ingredient_id: ingredientA.id, percentage: 50 }]
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('POST /api/formulations — base_batch_size validation', () => {
    it('should return 400 when base_batch_size is negative', async () => {
      const res = await request(app)
        .post('/api/formulations')
        .send({
          name: 'Negative batch size',
          base_batch_size: -10,
          ingredients: [{ ingredient_id: ingredientA.id, percentage: 50 }]
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 when base_batch_size is zero', async () => {
      const res = await request(app)
        .post('/api/formulations')
        .send({
          name: 'Zero batch size',
          base_batch_size: 0,
          ingredients: [{ ingredient_id: ingredientA.id, percentage: 50 }]
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('POST /api/formulations — ingredients array validation', () => {
    it('should return 400 when ingredients array is missing', async () => {
      const res = await request(app)
        .post('/api/formulations')
        .send({
          name: 'No ingredients',
          base_batch_size: 100
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 when ingredients array is empty', async () => {
      const res = await request(app)
        .post('/api/formulations')
        .send({
          name: 'Empty ingredients',
          base_batch_size: 100,
          ingredients: []
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 when ingredient in array is missing ingredient_id', async () => {
      const res = await request(app)
        .post('/api/formulations')
        .send({
          name: 'Missing ingredient_id',
          base_batch_size: 100,
          ingredients: [{ percentage: 50 }]
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 when ingredient in array is missing percentage', async () => {
      const res = await request(app)
        .post('/api/formulations')
        .send({
          name: 'Missing percentage',
          base_batch_size: 100,
          ingredients: [{ ingredient_id: ingredientA.id }]
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('POST /api/formulations — percentage validation', () => {
    it('should return 400 when percentage is negative (-1)', async () => {
      const res = await request(app)
        .post('/api/formulations')
        .send({
          name: 'Negative percentage',
          base_batch_size: 100,
          ingredients: [{ ingredient_id: ingredientA.id, percentage: -1 }]
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 when percentage is zero (0)', async () => {
      const res = await request(app)
        .post('/api/formulations')
        .send({
          name: 'Zero percentage',
          base_batch_size: 100,
          ingredients: [{ ingredient_id: ingredientA.id, percentage: 0 }]
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 when percentage exceeds 100 (101)', async () => {
      const res = await request(app)
        .post('/api/formulations')
        .send({
          name: 'Over 100 percentage',
          base_batch_size: 100,
          ingredients: [{ ingredient_id: ingredientA.id, percentage: 101 }]
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('POST /api/formulations — status enum validation', () => {
    it('should return 400 when status is an invalid value', async () => {
      const res = await request(app)
        .post('/api/formulations')
        .send({
          name: 'Invalid status',
          base_batch_size: 100,
          status: 'invalid_status',
          ingredients: [{ ingredient_id: ingredientA.id, percentage: 50 }]
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should accept status "testing"', async () => {
      const res = await request(app)
        .post('/api/formulations')
        .send({
          name: `Status Testing ${Date.now()}`,
          base_batch_size: 100,
          status: 'testing',
          ingredients: [{ ingredient_id: ingredientA.id, percentage: 50 }]
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('testing');
    });

    it('should accept status "finalized"', async () => {
      const res = await request(app)
        .post('/api/formulations')
        .send({
          name: `Status Finalized ${Date.now()}`,
          base_batch_size: 100,
          status: 'finalized',
          ingredients: [{ ingredient_id: ingredientA.id, percentage: 50 }]
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('finalized');
    });
  });

  describe('POST /api/formulations — parent_formulation_id validation', () => {
    it('should return 400 when parent_formulation_id is not a valid UUID', async () => {
      const res = await request(app)
        .post('/api/formulations')
        .send({
          name: 'Bad parent UUID',
          base_batch_size: 100,
          parent_formulation_id: 'not-a-uuid',
          ingredients: [{ ingredient_id: ingredientA.id, percentage: 50 }]
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('PUT /api/formulations/:id — validation', () => {
    it('should return 400 when name is missing on update', async () => {
      const created = await request(app)
        .post('/api/formulations')
        .send({
          name: `Update Test ${Date.now()}`,
          base_batch_size: 100,
          ingredients: [{ ingredient_id: ingredientA.id, percentage: 50 }]
        });

      const res = await request(app)
        .put(`/api/formulations/${created.body.id}`)
        .send({ base_batch_size: 200 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 when base_batch_size is missing on update', async () => {
      const created = await request(app)
        .post('/api/formulations')
        .send({
          name: `Update Test 2 ${Date.now()}`,
          base_batch_size: 100,
          ingredients: [{ ingredient_id: ingredientA.id, percentage: 50 }]
        });

      const res = await request(app)
        .put(`/api/formulations/${created.body.id}`)
        .send({ name: 'Only name' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. BATCH VALIDATION
// ═════════════════════════════════════════════════════════════════════════════

describe('Batch Validation', () => {

  describe('POST /api/batches — required fields', () => {
    it('should return 400 when formulation_id is missing', async () => {
      const res = await request(app)
        .post('/api/batches')
        .send({ target_amount: 200 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 when target_amount is missing', async () => {
      const res = await request(app)
        .post('/api/batches')
        .send({ formulation_id: finalizedFormulation.id });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('POST /api/batches — target_amount validation', () => {
    it('should return 400 when target_amount is negative', async () => {
      const res = await request(app)
        .post('/api/batches')
        .send({
          formulation_id: finalizedFormulation.id,
          target_amount: -50
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 when target_amount is zero', async () => {
      const res = await request(app)
        .post('/api/batches')
        .send({
          formulation_id: finalizedFormulation.id,
          target_amount: 0
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('POST /api/batches — formulation_id UUID validation', () => {
    it('should return 400 when formulation_id is not a valid UUID', async () => {
      const res = await request(app)
        .post('/api/batches')
        .send({
          formulation_id: 'not-a-valid-uuid',
          target_amount: 200
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('GET /api/formulations/:id/calculate — batch_size validation', () => {
    it('should return 400 when batch_size query param is missing', async () => {
      const res = await request(app)
        .get(`/api/formulations/${finalizedFormulation.id}/calculate`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 when batch_size is negative', async () => {
      const res = await request(app)
        .get(`/api/formulations/${finalizedFormulation.id}/calculate?batch_size=-100`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 when batch_size is zero', async () => {
      const res = await request(app)
        .get(`/api/formulations/${finalizedFormulation.id}/calculate?batch_size=0`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 when batch_size is not a number', async () => {
      const res = await request(app)
        .get(`/api/formulations/${finalizedFormulation.id}/calculate?batch_size=abc`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. UNKNOWN FIELD STRIPPING
// ═════════════════════════════════════════════════════════════════════════════

describe('Unknown Field Stripping', () => {

  it('should strip unknown fields from ingredient body and still create successfully', async () => {
    const res = await request(app)
      .post('/api/ingredients')
      .send(makeIngredient({
        unknown_field: 'should be stripped',
        extra_data: 12345,
        random_key: true
      }));

    expect(res.status).toBe(201);
    expect(res.body.unknown_field).toBeUndefined();
    expect(res.body.extra_data).toBeUndefined();
    expect(res.body.random_key).toBeUndefined();
  });

  it('should strip unknown fields from formulation body and still create successfully', async () => {
    const res = await request(app)
      .post('/api/formulations')
      .send({
        name: `Strip Test Formulation ${Date.now()}`,
        base_batch_size: 100,
        ingredients: [{ ingredient_id: ingredientA.id, percentage: 50 }],
        totally_made_up: 'should be stripped'
      });

    expect(res.status).toBe(201);
    expect(res.body.totally_made_up).toBeUndefined();
  });

  it('should strip unknown fields from batch body and still create successfully', async () => {
    const res = await request(app)
      .post('/api/batches')
      .send({
        formulation_id: finalizedFormulation.id,
        target_amount: 100,
        hacker_field: 'drop table'
      });

    expect(res.status).toBe(201);
    expect(res.body.hacker_field).toBeUndefined();
  });
});
