// Queries/formulationsQueries.js
const db = require('../db/dbConfig');

const getAllFormulations = async () => {
  const formulations = await db.any(`
    SELECT 
      id,
      name,
      description,
      base_batch_size,
      unit,
      status,
      version_number,
      parent_formulation_id,
      phases,
      instructions,
      notes,
      created_at,
      updated_at
    FROM formulations
    ORDER BY created_at DESC
  `);
  return formulations;
};

const getFormulationById = async (id) => {
  const formulation = await db.oneOrNone(`
    SELECT * FROM formulations WHERE id = $1
  `, [id]);
  
  if (!formulation) {
    return null;
  }
  
  const ingredients = await db.any(`
    SELECT 
      fi.id AS formulation_ingredient_id,
      fi.percentage,
      fi.phase,
      fi.sort_order,
      fi.notes AS ingredient_notes,
      i.id AS ingredient_id,
      i.name AS ingredient_name,
      i.inci_name,
      i.ingredient_type,
      i.is_humectant,
      i.is_emollient,
      i.is_occlusive,
      i.is_moisturizing,
      i.is_anhydrous
    FROM formulation_ingredients fi
    JOIN ingredients i ON fi.ingredient_id = i.id
    WHERE fi.formulation_id = $1
    ORDER BY fi.sort_order, fi.phase, i.name
  `, [id]);
  
  return {
    ...formulation,
    ingredients: ingredients
  };
};

const createFormulation = async (formulationData) => {
  const {
    name,
    description,
    base_batch_size,
    unit,
    status,
    version_number,
    parent_formulation_id,
    phases,
    instructions,
    notes
  } = formulationData;
  
  const newFormulation = await db.one(`
    INSERT INTO formulations (
      name,
      description,
      base_batch_size,
      unit,
      status,
      version_number,
      parent_formulation_id,
      phases,
      instructions,
      notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `, [
    name,
    description || null,
    base_batch_size,
    unit || 'g',
    status || 'testing',
    version_number || 1,
    parent_formulation_id || null,
    phases || null,
    instructions || null,
    notes || null
  ]);
  
  return newFormulation;
};

const addIngredientToFormulation = async (formulationId, ingredientData) => {
  const {
    ingredient_id,
    percentage,
    phase,
    sort_order,
    notes
  } = ingredientData;
  
  const link = await db.one(`
    INSERT INTO formulation_ingredients (
      formulation_id,
      ingredient_id,
      percentage,
      phase,
      sort_order,
      notes
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [
    formulationId,
    ingredient_id,
    percentage,
    phase || null,
    sort_order || 0,
    notes || null
  ]);
  
  return link;
};

const updateFormulation = async (id, formulationData) => {
  const {
    name,
    description,
    base_batch_size,
    unit,
    status,
    phases,
    instructions,
    notes
  } = formulationData;
  
  const updated = await db.oneOrNone(`
    UPDATE formulations SET
      name = $1,
      description = $2,
      base_batch_size = $3,
      unit = $4,
      status = $5,
      phases = $6,
      instructions = $7,
      notes = $8,
      updated_at = NOW()
    WHERE id = $9
    RETURNING *
  `, [
    name,
    description || null,
    base_batch_size,
    unit || 'g',
    status,
    phases || null,
    instructions || null,
    notes || null,
    id
  ]);
  
  return updated;
};

const removeIngredientFromFormulation = async (formulationId, ingredientId) => {
  const removed = await db.oneOrNone(`
    DELETE FROM formulation_ingredients
    WHERE formulation_id = $1 AND ingredient_id = $2
    RETURNING *
  `, [formulationId, ingredientId]);
  
  return removed;
};

const deleteFormulation = async (id) => {
  const deleted = await db.oneOrNone(`
    DELETE FROM formulations WHERE id = $1 RETURNING *
  `, [id]);
  
  return deleted;
};

module.exports = {
  getAllFormulations,
  getFormulationById,
  createFormulation,
  addIngredientToFormulation,
  updateFormulation,
  removeIngredientFromFormulation,
  deleteFormulation
};