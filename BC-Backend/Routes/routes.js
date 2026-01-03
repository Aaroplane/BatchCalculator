const { Router } = require('express');
const router = Router();
const ingredientsController = require('../controllers/ingredientsController');

router.get('/ingredients', ingredientsController.getAllIngredients);
router.get('/ingredients/:id', ingredientsController.getIngredientById);
router.post('/ingredients', ingredientsController.createIngredient);
router.put('/ingredients/:id', ingredientsController.updateIngredient);
router.delete('/ingredients/:id', ingredientsController.deleteIngredient);

module.exports = router;