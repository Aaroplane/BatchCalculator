const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isValidUUID = (id) => UUID_REGEX.test(id);

const isPositiveNumber = (value) => {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
};

// Middleware: validates that :id param is a valid UUID
const validateIdParam = (req, res, next) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    return res.status(400).json({ error: 'Invalid ID format - expected UUID' });
  }

  next();
};

// Middleware: validates that :ingredientId param is a valid UUID
const validateIngredientIdParam = (req, res, next) => {
  const { ingredientId } = req.params;

  if (ingredientId && !isValidUUID(ingredientId)) {
    return res.status(400).json({ error: 'Invalid ingredient ID format - expected UUID' });
  }

  next();
};

module.exports = {
  isValidUUID,
  isPositiveNumber,
  validateIdParam,
  validateIngredientIdParam
};
