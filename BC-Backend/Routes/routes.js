const { Router } = require('express');
const router = Router();
const ingredientsController = require('../controllers/ingredientsController');
const formulationsController = require('../controllers/formulationsController');
const batchesController = require('../controllers/productionBatchesController');
const { validateIdParam, validateIngredientIdParam, validateBody, validateQuery } = require('../middleware/validate');
const asyncHandler = require('../middleware/asyncHandler');

// Import validation schemas
const { createIngredientSchema, updateIngredientSchema } = require('../schemas/ingredientSchema');
const { createFormulationSchema, updateFormulationSchema, addIngredientSchema } = require('../schemas/formulationSchema');
const { createBatchSchema, updateActualsSchema, calculateQuerySchema } = require('../schemas/batchSchema');

// Ingredient routes
router.get('/ingredients', asyncHandler(ingredientsController.getAllIngredients));
router.get('/ingredients/:id', validateIdParam, asyncHandler(ingredientsController.getIngredientById));
router.post('/ingredients', validateBody(createIngredientSchema), asyncHandler(ingredientsController.createIngredient));
router.put('/ingredients/:id', validateIdParam, validateBody(updateIngredientSchema), asyncHandler(ingredientsController.updateIngredient));
router.delete('/ingredients/:id', validateIdParam, asyncHandler(ingredientsController.deleteIngredient));

// Formulation routes
router.get('/formulations', asyncHandler(formulationsController.getAllFormulations));
router.get('/formulations/:id', validateIdParam, asyncHandler(formulationsController.getFormulationById));
router.post('/formulations', validateBody(createFormulationSchema), asyncHandler(formulationsController.createFormulation));
router.put('/formulations/:id', validateIdParam, validateBody(updateFormulationSchema), asyncHandler(formulationsController.updateFormulation));
router.delete('/formulations/:id', validateIdParam, asyncHandler(formulationsController.deleteFormulation));
router.post('/formulations/:id/ingredients', validateIdParam, validateBody(addIngredientSchema), asyncHandler(formulationsController.addIngredient));
router.delete('/formulations/:id/ingredients/:ingredientId', validateIdParam, validateIngredientIdParam, asyncHandler(formulationsController.removeIngredient));

// Batch routes
router.get('/formulations/:id/calculate', validateIdParam, validateQuery(calculateQuerySchema), asyncHandler(batchesController.calculateBatch));
router.get('/batches', asyncHandler(batchesController.getAllBatches));
router.get('/batches/:id', validateIdParam, asyncHandler(batchesController.getBatchById));
router.post('/batches', validateBody(createBatchSchema), asyncHandler(batchesController.createBatch));
router.put('/batches/:id/actuals', validateIdParam, validateBody(updateActualsSchema), asyncHandler(batchesController.updateBatchActuals));
router.delete('/batches/:id', validateIdParam, asyncHandler(batchesController.deleteBatch));

module.exports = router;
