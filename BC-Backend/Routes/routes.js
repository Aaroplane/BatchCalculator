const { Router } = require('express');
const router = Router();
const ingredientsController = require('../controllers/ingredientsController');
const formulationsController = require('../controllers/formulationsController');
const batchesController = require('../controllers/productionBatchesController');
const { validateIdParam, validateIngredientIdParam } = require('../middleware/validate');
const asyncHandler = require('../middleware/asyncHandler');

router.get('/ingredients', asyncHandler(ingredientsController.getAllIngredients));
router.get('/ingredients/:id', validateIdParam, asyncHandler(ingredientsController.getIngredientById));
router.post('/ingredients', asyncHandler(ingredientsController.createIngredient));
router.put('/ingredients/:id', validateIdParam, asyncHandler(ingredientsController.updateIngredient));
router.delete('/ingredients/:id', validateIdParam, asyncHandler(ingredientsController.deleteIngredient));

router.get('/formulations', asyncHandler(formulationsController.getAllFormulations));
router.get('/formulations/:id', validateIdParam, asyncHandler(formulationsController.getFormulationById));
router.post('/formulations', asyncHandler(formulationsController.createFormulation));
router.put('/formulations/:id', validateIdParam, asyncHandler(formulationsController.updateFormulation));
router.delete('/formulations/:id', validateIdParam, asyncHandler(formulationsController.deleteFormulation));
router.post('/formulations/:id/ingredients', validateIdParam, asyncHandler(formulationsController.addIngredient));
router.delete('/formulations/:id/ingredients/:ingredientId', validateIdParam, validateIngredientIdParam, asyncHandler(formulationsController.removeIngredient));

router.get('/formulations/:id/calculate', validateIdParam, asyncHandler(batchesController.calculateBatch));
router.get('/batches', asyncHandler(batchesController.getAllBatches));
router.get('/batches/:id', validateIdParam, asyncHandler(batchesController.getBatchById));
router.post('/batches', asyncHandler(batchesController.createBatch));
router.put('/batches/:id/actuals', validateIdParam, asyncHandler(batchesController.updateBatchActuals));
router.delete('/batches/:id', validateIdParam, asyncHandler(batchesController.deleteBatch));
module.exports = router;
