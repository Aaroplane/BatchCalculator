const batchQueries = require('../Queries/productionBatchesQueries');
const formulationQueries = require('../Queries/formulationsQueries');

const CAN_CREATE_BATCHES = ['finalized', 'freeze', 'archived'];

const calculateBatch = async (req, res) => {
  const { id } = req.params;  
  const { batch_size } = req.query;  
  
  const parsedSize = parseFloat(batch_size);
  if (!batch_size || isNaN(parsedSize) || parsedSize <= 0) {
    return res.status(400).json({
      error: 'batch_size query parameter is required and must be a positive number'
    });
  }
  
  try {
    const formulation = await formulationQueries.getFormulationById(id);
    
    if (!formulation) {
      return res.status(404).json({ error: 'Formulation not found' });
    }
    
    const scaleFactor = parsedSize / formulation.base_batch_size;
    
    const scaledIngredients = formulation.ingredients.map(ing => ({
      ingredient_id: ing.ingredient_id,
      ingredient_name: ing.ingredient_name,
      inci_name: ing.inci_name,
      percentage: ing.percentage,
      original_amount: (ing.percentage / 100) * formulation.base_batch_size,
      planned_amount: (ing.percentage / 100) * parsedSize,
      unit: formulation.unit,
      phase: ing.phase
    }));
    
    res.status(200).json({
      formulation_id: formulation.id,
      formulation_name: formulation.name,
      original_batch_size: formulation.base_batch_size,
      target_batch_size: parsedSize,
      scale_factor: scaleFactor,
      unit: formulation.unit,
      ingredients: scaledIngredients
    });
  } catch (error) {
    console.error("Error calculating batch:", error);
    res.status(500).json({ error: "Failed to calculate batch" });
  }
};

const getAllBatches = async (req, res) => {
  try {
    const batches = await batchQueries.getAllBatches();
    res.status(200).json(batches);
  } catch (error) {
    console.error("Error fetching batches:", error);
    res.status(500).json({ error: "Failed to fetch batches" });
  }
};

const getBatchById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const batch = await batchQueries.getBatchById(id);
    
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    res.status(200).json(batch);
  } catch (error) {
    console.error("Error fetching batch:", error);
    res.status(500).json({ error: "Failed to fetch batch" });
  }
};

const createBatch = async (req, res) => {
  const { formulation_id, target_amount, batch_name, notes } = req.body;
  
  if (!formulation_id || !target_amount) {
    return res.status(400).json({ 
      error: 'formulation_id and target_amount are required' 
    });
  }
  
  try {
    const formulation = await formulationQueries.getFormulationById(formulation_id);
    
    if (!formulation) {
      return res.status(404).json({ error: 'Formulation not found' });
    }
    
    if (!CAN_CREATE_BATCHES.includes(formulation.status)) {
      return res.status(400).json({
        error: `Cannot create batch for ${formulation.status} formulation`,
        message: 'Only finalized, freeze, or archived formulations can be produced',
        current_status: formulation.status,
        allowed_statuses: CAN_CREATE_BATCHES
      });
    }
    
    const ingredientsData = formulation.ingredients.map(ing => ({
      ingredient_id: ing.ingredient_id,
      planned_amount: (ing.percentage / 100) * target_amount,
      unit: formulation.unit
    }));
    
    const result = await batchQueries.createBatch({
      formulation_id,
      batch_name,
      target_amount,
      unit: formulation.unit,
      notes
    }, ingredientsData);
    
    const completeBatch = await batchQueries.getBatchById(result.batch.id);
    
    res.status(201).json(completeBatch);
  } catch (error) {
    console.error("Error creating batch:", error);
    res.status(500).json({ error: "Failed to create batch" });
  }
};

const updateBatchActuals = async (req, res) => {
  const { id } = req.params;
  const { actual_total, ingredients, notes } = req.body;
  
  if (!ingredients || !Array.isArray(ingredients)) {
    return res.status(400).json({ 
      error: 'ingredients array is required' 
    });
  }
  
  try {
    await batchQueries.updateBatchActuals(id, actual_total, ingredients, notes);
    
    const updatedBatch = await batchQueries.getBatchById(id);
    
    if (!updatedBatch) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    res.status(200).json(updatedBatch);
  } catch (error) {
    console.error("Error updating batch actuals:", error);
    res.status(500).json({ error: "Failed to update batch actuals" });
  }
};

const deleteBatch = async (req, res) => {
  const { id } = req.params;
  
  try {
    const deleted = await batchQueries.deleteBatch(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    res.status(200).json({ 
      message: 'Batch deleted successfully',
      deleted 
    });
  } catch (error) {
    console.error("Error deleting batch:", error);
    res.status(500).json({ error: "Failed to delete batch" });
  }
};

module.exports = {
  calculateBatch,
  getAllBatches,
  getBatchById,
  createBatch,
  updateBatchActuals,
  deleteBatch
};