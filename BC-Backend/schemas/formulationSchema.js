const Joi = require('joi');

// UUID pattern matching the existing validation in middleware
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Ingredient object schema used in formulation creation
const ingredientItemSchema = Joi.object({
  ingredient_id: Joi.string()
    .pattern(UUID_PATTERN)
    .required()
    .messages({
      'string.pattern.base': 'Ingredient ID must be a valid UUID',
      'any.required': 'Ingredient ID is required'
    }),

  percentage: Joi.number()
    .positive()
    .max(100)
    .required()
    .messages({
      'number.positive': 'Percentage must be greater than 0',
      'number.max': 'Percentage must not exceed 100',
      'any.required': 'Percentage is required'
    }),

  phase: Joi.string()
    .max(50)
    .allow(null, '')
    .messages({
      'string.max': 'Phase must not exceed 50 characters'
    }),

  sort_order: Joi.number()
    .integer()
    .min(0)
    .allow(null)
    .messages({
      'number.min': 'Sort order must be greater than or equal to 0',
      'number.integer': 'Sort order must be an integer'
    }),

  notes: Joi.string()
    .allow(null, '')
});

// Schema for creating a new formulation (with ingredients)
const createFormulationSchema = Joi.object({
  name: Joi.string()
    .trim()
    .max(255)
    .required()
    .messages({
      'string.empty': 'Name is required',
      'string.max': 'Name must not exceed 255 characters',
      'any.required': 'Name is required'
    }),

  description: Joi.string()
    .allow(null, ''),

  base_batch_size: Joi.number()
    .positive()
    .required()
    .messages({
      'number.positive': 'Base batch size must be greater than 0',
      'any.required': 'Base batch size is required'
    }),

  unit: Joi.string()
    .max(10)
    .allow(null, '')
    .messages({
      'string.max': 'Unit must not exceed 10 characters'
    }),

  status: Joi.string()
    .valid('testing', 'finalized', 'freeze', 'archived', 'discontinued')
    .allow(null, '')
    .messages({
      'any.only': 'Status must be one of: testing, finalized, freeze, archived, discontinued'
    }),

  version_number: Joi.number()
    .integer()
    .min(1)
    .allow(null)
    .messages({
      'number.min': 'Version number must be at least 1',
      'number.integer': 'Version number must be an integer'
    }),

  parent_formulation_id: Joi.string()
    .pattern(UUID_PATTERN)
    .allow(null)
    .messages({
      'string.pattern.base': 'Parent formulation ID must be a valid UUID'
    }),

  phases: Joi.string()
    .allow(null, ''),

  instructions: Joi.string()
    .allow(null, ''),

  notes: Joi.string()
    .allow(null, ''),

  ingredients: Joi.array()
    .items(ingredientItemSchema)
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one ingredient is required',
      'any.required': 'Ingredients array is required'
    })
});

// Schema for updating formulation metadata (without ingredients)
const updateFormulationSchema = Joi.object({
  name: Joi.string()
    .trim()
    .max(255)
    .required()
    .messages({
      'string.empty': 'Name is required',
      'string.max': 'Name must not exceed 255 characters',
      'any.required': 'Name is required'
    }),

  description: Joi.string()
    .allow(null, ''),

  base_batch_size: Joi.number()
    .positive()
    .required()
    .messages({
      'number.positive': 'Base batch size must be greater than 0',
      'any.required': 'Base batch size is required'
    }),

  unit: Joi.string()
    .max(10)
    .allow(null, '')
    .messages({
      'string.max': 'Unit must not exceed 10 characters'
    }),

  status: Joi.string()
    .valid('testing', 'finalized', 'freeze', 'archived', 'discontinued')
    .allow(null, '')
    .messages({
      'any.only': 'Status must be one of: testing, finalized, freeze, archived, discontinued'
    }),

  version_number: Joi.number()
    .integer()
    .min(1)
    .allow(null)
    .messages({
      'number.min': 'Version number must be at least 1',
      'number.integer': 'Version number must be an integer'
    }),

  parent_formulation_id: Joi.string()
    .pattern(UUID_PATTERN)
    .allow(null)
    .messages({
      'string.pattern.base': 'Parent formulation ID must be a valid UUID'
    }),

  phases: Joi.string()
    .allow(null, ''),

  instructions: Joi.string()
    .allow(null, ''),

  notes: Joi.string()
    .allow(null, '')
});

// Schema for adding a single ingredient to an existing formulation
const addIngredientSchema = ingredientItemSchema;

module.exports = {
  createFormulationSchema,
  updateFormulationSchema,
  addIngredientSchema
};
