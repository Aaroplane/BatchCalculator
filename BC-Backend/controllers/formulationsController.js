const queries = require('../Queries/formulationsQueries');
const ingredientQueries = require('../Queries/ingredientsQueries');

const getAllFormulations = async (req, res) => {
  try {
    const { ingredient_id, ingredient_ids } = req.query;
    const formulations = await queries.getAllFormulations({
      ingredient_id,
      ingredient_ids
    });
    res.status(200).json(formulations);
  } catch (error) {
    console.error("Error fetching formulations:", error);
    res.status(500).json({ error: "Failed to fetch formulations" });
  }
};

const getFormulationById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const formulation = await queries.getFormulationById(id);
    
    if (!formulation) {
      return res.status(404).json({ error: 'Formulation not found' });
    }
    
    res.status(200).json(formulation);
  } catch (error) {
    console.error("Error fetching formulation:", error);
    res.status(500).json({ error: "Failed to fetch formulation" });
  }
};

const createFormulation = async (req, res) => {
  const { name, base_batch_size, ingredients, ...otherData } = req.body;

  try {
    // Verify all ingredients exist in database before creating formulation
    for (const ingredient of ingredients) {
      const exists = await ingredientQueries.getIngredientById(ingredient.ingredient_id);
      if (!exists) {
        return res.status(400).json({
          error: `Ingredient not found in database`,
          message: 'Add this ingredient to the database before creating a formulation',
          missing_ingredient_id: ingredient.ingredient_id
        });
      }
    }

    const newFormulation = await queries.createFormulation({
      name,
      base_batch_size,
      ...otherData
    });

    const addedIngredients = [];
    for (const ingredient of ingredients) {
      const link = await queries.addIngredientToFormulation(
        newFormulation.id,
        ingredient
      );
      addedIngredients.push(link);
    }

    const completeFormulation = await queries.getFormulationById(newFormulation.id);

    res.status(201).json(completeFormulation);
  } catch (error) {
    console.error("Error creating formulation:", error);
    res.status(500).json({ error: "Failed to create formulation" });
  }
};

const updateFormulation = async (req, res) => {
  const { id } = req.params;
  const { name, base_batch_size, ...otherData } = req.body;

  try {
    const updated = await queries.updateFormulation(id, {
      name,
      base_batch_size,
      ...otherData
    });

    if (!updated) {
      return res.status(404).json({ error: 'Formulation not found' });
    }

    const completeFormulation = await queries.getFormulationById(id);
    res.status(200).json(completeFormulation);
  } catch (error) {
    console.error("Error updating formulation:", error);
    res.status(500).json({ error: "Failed to update formulation" });
  }
};

const deleteFormulation = async (req, res) => {
  const { id } = req.params;
  
  try {
    const deleted = await queries.deleteFormulation(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Formulation not found' });
    }
    
    res.status(200).json({ 
      message: 'Formulation deleted successfully',
      deleted 
    });
  } catch (error) {
    console.error("Error deleting formulation:", error);
    res.status(500).json({ error: "Failed to delete formulation" });
  }
};

const addIngredient = async (req, res) => {
  const { id } = req.params;
  const ingredientData = req.body;

  try {
    const link = await queries.addIngredientToFormulation(id, ingredientData);
    res.status(201).json(link);
  } catch (error) {
    console.error("Error adding ingredient:", error);
    res.status(500).json({ error: "Failed to add ingredient" });
  }
};

const removeIngredient = async (req, res) => {
  const { id, ingredientId } = req.params;
  
  try {
    const removed = await queries.removeIngredientFromFormulation(id, ingredientId);
    
    if (!removed) {
      return res.status(404).json({ 
        error: 'Ingredient not found in this formulation' 
      });
    }
    
    res.status(200).json({ 
      message: 'Ingredient removed from formulation',
      removed 
    });
  } catch (error) {
    console.error("Error removing ingredient:", error);
    res.status(500).json({ error: "Failed to remove ingredient" });
  }
};

module.exports = {
  getAllFormulations,
  getFormulationById,
  createFormulation,
  updateFormulation,
  deleteFormulation,
  addIngredient,
  removeIngredient
};