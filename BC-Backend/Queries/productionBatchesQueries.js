const db = require("../db/dbConfig");

const getAllBatches = async () => {
  const batches = await db.any(`
    SELECT 
      pb.*,
      f.name AS formulation_name,
      f.status AS formulation_status
    FROM production_batches pb
    JOIN formulations f ON pb.formulation_id = f.id
    ORDER BY pb.production_date DESC, pb.created_at DESC
  `);
  return batches;
};

const getBatchById = async (id) => {
  const batch = await db.oneOrNone(
    `
    SELECT 
      pb.*,
      f.name AS formulation_name,
      f.base_batch_size AS formulation_base_size
    FROM production_batches pb
    JOIN formulations f ON pb.formulation_id = f.id
    WHERE pb.id = $1
  `,
    [id]
  );

  if (!batch) {
    return null;
  }

  const ingredients = await db.any(
    `
    SELECT 
      bi.id AS batch_ingredient_id,
      bi.planned_amount,
      bi.actual_amount,
      bi.unit,
      bi.notes AS ingredient_notes,
      (bi.actual_amount - bi.planned_amount) AS variance,
      CASE 
        WHEN bi.planned_amount > 0 
        THEN ROUND(((bi.actual_amount - bi.planned_amount) / bi.planned_amount * 100)::numeric, 2)
        ELSE 0
      END AS variance_percent,
      i.id AS ingredient_id,
      i.name AS ingredient_name,
      i.inci_name
    FROM batch_ingredients bi
    JOIN ingredients i ON bi.ingredient_id = i.id
    WHERE bi.batch_id = $1
    ORDER BY i.name
  `,
    [id]
  );

  return {
    ...batch,
    ingredients: ingredients,
  };
};

const createBatch = async (batchData, ingredientsData) => {
  const {
    formulation_id,
    batch_name,
    target_amount,
    unit,
    production_date,
    notes,
  } = batchData;

  const newBatch = await db.one(
    `
    INSERT INTO production_batches (
      formulation_id,
      batch_name,
      target_amount,
      unit,
      production_date,
      notes
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `,
    [
      formulation_id,
      batch_name || null,
      target_amount,
      unit || "g",
      production_date || new Date(),
      notes || null,
    ]
  );

  const batchIngredients = [];
  for (const ingredient of ingredientsData) {
    const batchIngredient = await db.one(
      `
      INSERT INTO batch_ingredients (
        batch_id,
        ingredient_id,
        planned_amount,
        unit
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
      [
        newBatch.id,
        ingredient.ingredient_id,
        ingredient.planned_amount,
        ingredient.unit || "g",
      ]
    );
    batchIngredients.push(batchIngredient);
  }

  return { batch: newBatch, ingredients: batchIngredients };
};

const updateBatchActuals = async (
  batchId,
  actualTotal,
  ingredientsActuals,
  notes
) => {
  return db.tx(async (t) => {
    const updatedBatch = await t.one(
      `
      UPDATE production_batches
      SET
        actual_amount = $1,
        notes = CASE
          WHEN $2 IS NOT NULL THEN $2
          ELSE notes
        END
      WHERE id = $3
      RETURNING *
    `,
      [actualTotal, notes, batchId]
    );

    for (const ingredient of ingredientsActuals) {
      await t.none(
        `
        UPDATE batch_ingredients
        SET
          actual_amount = $1,
          notes = $2
        WHERE id = $3
      `,
        [
          ingredient.actual_amount,
          ingredient.notes || null,
          ingredient.batch_ingredient_id,
        ]
      );
    }

    return updatedBatch;
  });
};

const deleteBatch = async (id) => {
  const deleted = await db.oneOrNone(
    `
    DELETE FROM production_batches WHERE id = $1 RETURNING *
  `,
    [id]
  );
  return deleted;
};

module.exports = {
  getAllBatches,
  getBatchById,
  createBatch,
  updateBatchActuals,
  deleteBatch,
};
