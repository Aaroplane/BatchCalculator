const queries = require('../Queries/ingredientsQueries');

const getAllIngredients = async (req, res) => {
  try {
    const ingredients = await queries.getAllIngredients();
    
    if (ingredients.length === 0) {
      return res.status(404).json({ message: "No ingredients found" });
    }
    
    res.status(200).json(ingredients);
  } catch (error) {
    console.error("Error fetching ingredients:", error);
    res.status(500).json({ error: "Failed to fetch ingredients" });
  }
};

const getIngredientById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const ingredient = await queries.getIngredientById(id);
    
    if (!ingredient) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }
    
    res.status(200).json(ingredient);
  } catch (error) {
    console.error("Error fetching ingredient:", error);
    res.status(500).json({ error: "Failed to fetch ingredient" });
  }
};

const createIngredient = async (req, res) => {
  try {
    const newIngredient = await queries.createIngredient(req.body);
    res.status(201).json(newIngredient);
  } catch (error) {
    console.error("Error creating ingredient:", error);
    res.status(500).json({ error: "Failed to create ingredient" });
  }
};

const updateIngredient = async (req, res) => {
  const { id } = req.params;

  try {
    const updated = await queries.updateIngredient(id, req.body);

    if (!updated) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating ingredient:", error);
    res.status(500).json({ error: "Failed to update ingredient" });
  }
};

const deleteIngredient = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await queries.deleteIngredient(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }
    
    res.status(200).json({ 
      message: 'Ingredient deleted successfully', 
      deleted 
    });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({ 
        error: 'Cannot delete ingredient - it is used in formulations' 
      });
    }
    
    console.error("Error deleting ingredient:", error);
    res.status(500).json({ error: "Failed to delete ingredient" });
  }
};

module.exports = {
  getAllIngredients,
  getIngredientById,
  createIngredient,
  updateIngredient,
  deleteIngredient
};