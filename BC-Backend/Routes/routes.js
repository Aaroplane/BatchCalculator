const { Router } = require('express');
const router = Router();
const ingredientsController = require('../controllers/ingredientsController');
const formulationsController = require('../controllers/formulationsController');
const batchesController = require('../controllers/productionBatchesController');
const { validateIdParam, validateIngredientIdParam } = require('../middleware/validate');

router.get('/ingredients', ingredientsController.getAllIngredients);
router.get('/ingredients/:id', validateIdParam, ingredientsController.getIngredientById);
router.post('/ingredients', ingredientsController.createIngredient);
router.put('/ingredients/:id', validateIdParam, ingredientsController.updateIngredient);
router.delete('/ingredients/:id', validateIdParam, ingredientsController.deleteIngredient);

router.get('/formulations', formulationsController.getAllFormulations);
router.get('/formulations/:id', validateIdParam, formulationsController.getFormulationById);
router.post('/formulations', formulationsController.createFormulation);
router.put('/formulations/:id', validateIdParam, formulationsController.updateFormulation);
router.delete('/formulations/:id', validateIdParam, formulationsController.deleteFormulation);
router.post('/formulations/:id/ingredients', validateIdParam, formulationsController.addIngredient);
router.delete('/formulations/:id/ingredients/:ingredientId', validateIdParam, validateIngredientIdParam, formulationsController.removeIngredient);

router.get('/formulations/:id/calculate', validateIdParam, batchesController.calculateBatch);
router.get('/batches', batchesController.getAllBatches);
router.get('/batches/:id', validateIdParam, batchesController.getBatchById);
router.post('/batches', batchesController.createBatch);
router.put('/batches/:id/actuals', validateIdParam, batchesController.updateBatchActuals);
router.delete('/batches/:id', validateIdParam, batchesController.deleteBatch);
module.exports = router;