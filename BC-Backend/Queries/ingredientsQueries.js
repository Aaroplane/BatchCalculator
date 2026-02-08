const db = require('../db/dbConfig.js');

const getAllIngredients = async () => {
  const allIngredients = await db.any("SELECT * FROM ingredients");
  return allIngredients;
};

const getIngredientById = async (id) => {
  const ingredient = await db.oneOrNone(
    "SELECT * FROM ingredients WHERE id = $1",
    [id]
  );
  return ingredient;
};

const createIngredient = async (ingredientData) => {
  const {
    name,
    inci_name,
    origin,
    ingredient_type,
    is_humectant,
    is_emollient,
    is_occlusive,
    is_moisturizing,
    is_anhydrous,
    ph_min,
    ph_max,
    solubility,
    max_usage_rate,
    notes
  } = ingredientData;

  const newIngredient = await db.one(
    `INSERT INTO ingredients (
      name, inci_name, origin, ingredient_type,
      is_humectant, is_emollient, is_occlusive,
      is_moisturizing, is_anhydrous,
      ph_min, ph_max, solubility, max_usage_rate, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *`,
    [
      name,
      inci_name || null,
      origin || null,
      ingredient_type || null,
      is_humectant || false,
      is_emollient || false,
      is_occlusive || false,
      is_moisturizing || false,
      is_anhydrous || false,
      ph_min || null,
      ph_max || null,
      solubility || null,
      max_usage_rate || null,
      notes || null
    ]
  );

  return newIngredient;
};

const updateIngredient = async (id, ingredientData) => {
  const {
    name,
    inci_name,
    origin,
    ingredient_type,
    is_humectant,
    is_emollient,
    is_occlusive,
    is_moisturizing,
    is_anhydrous,
    ph_min,
    ph_max,
    solubility,
    max_usage_rate,
    notes
  } = ingredientData;

  const updated = await db.oneOrNone(
    `UPDATE ingredients SET
      name = $1, inci_name = $2, origin = $3, ingredient_type = $4,
      is_humectant = $5, is_emollient = $6, is_occlusive = $7,
      is_moisturizing = $8, is_anhydrous = $9,
      ph_min = $10, ph_max = $11, solubility = $12,
      max_usage_rate = $13, notes = $14, updated_at = NOW()
    WHERE id = $15
    RETURNING *`,
    [
      name,
      inci_name || null,
      origin || null,
      ingredient_type || null,
      is_humectant || false,
      is_emollient || false,
      is_occlusive || false,
      is_moisturizing || false,
      is_anhydrous || false,
      ph_min || null,
      ph_max || null,
      solubility || null,
      max_usage_rate || null,
      notes || null,
      id
    ]
  );

  return updated;
};

const deleteIngredient = async (id) => {
  const deleted = await db.oneOrNone(
    "DELETE FROM ingredients WHERE id = $1 RETURNING *",
    [id]
  );
  return deleted;
};

module.exports = {
  getAllIngredients,
  getIngredientById,
  createIngredient,
  updateIngredient,
  deleteIngredient
};