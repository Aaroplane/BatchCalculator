const { Router } = require('express');
const router = Router();
const ingredientsController = require('../controllers/ingredientsController');
const formulationsController = require('../controllers/formulationsController');


router.get('/ingredients', ingredientsController.getAllIngredients);
router.get('/ingredients/:id', ingredientsController.getIngredientById);
router.post('/ingredients', ingredientsController.createIngredient);
router.put('/ingredients/:id', ingredientsController.updateIngredient);
router.delete('/ingredients/:id', ingredientsController.deleteIngredient);

router.get('/formulations', formulationsController.getAllFormulations);
router.get('/formulations/:id', formulationsController.getFormulationById);
router.post('/formulations', formulationsController.createFormulation);
router.put('/formulations/:id', formulationsController.updateFormulation);
router.delete('/formulations/:id', formulationsController.deleteFormulation);

router.post('/formulations/:id/ingredients', formulationsController.addIngredient);
router.delete('/formulations/:id/ingredients/:ingredientId', formulationsController.removeIngredient);

module.exports = router;