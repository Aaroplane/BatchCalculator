const Joi = require('joi');

// UUID pattern matching the existing validation in middleware
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Schema for creating a new batch
const createBatchSchema = Joi.object({
  formulation_id: Joi.string()
    .pattern(UUID_PATTERN)
    .required()
    .messages({
      'string.pattern.base': 'Formulation ID must be a valid UUID',
      'any.required': 'Formulation ID is required'
    }),

  target_amount: Joi.number()
    .positive()
    .required()
    .messages({
      'number.positive': 'Target amount must be greater than 0',
      'any.required': 'Target amount is required'
    }),

  batch_name: Joi.string()
    .max(255)
    .allow(null, '')
    .messages({
      'string.max': 'Batch name must not exceed 255 characters'
    }),

  notes: Joi.string()
    .allow(null, '')
});

// Schema for updating batch actuals
const updateActualsSchema = Joi.object({
  actual_total: Joi.number()
    .min(0)
    .allow(null)
    .messages({
      'number.min': 'Actual total must be greater than or equal to 0'
    }),

  ingredients: Joi.array()
    .items(
      Joi.object({
        batch_ingredient_id: Joi.string()
          .pattern(UUID_PATTERN)
          .required()
          .messages({
            'string.pattern.base': 'Batch ingredient ID must be a valid UUID',
            'any.required': 'Batch ingredient ID is required'
          }),

        actual_amount: Joi.number()
          .min(0)
          .required()
          .messages({
            'number.min': 'Actual amount must be greater than or equal to 0',
            'any.required': 'Actual amount is required'
          }),

        notes: Joi.string()
          .allow(null, '')
      })
    )
    .required()
    .messages({
      'any.required': 'ingredients array is required'
    }),

  notes: Joi.string()
    .allow(null, '')
});

// Schema for validating query params in calculate endpoint
const calculateQuerySchema = Joi.object({
  batch_size: Joi.number()
    .positive()
    .required()
    .messages({
      'number.base': 'batch_size query parameter is required and must be a positive number',
      'number.positive': 'batch_size query parameter is required and must be a positive number',
      'any.required': 'batch_size query parameter is required and must be a positive number'
    })
});

module.exports = {
  createBatchSchema,
  updateActualsSchema,
  calculateQuerySchema
};
