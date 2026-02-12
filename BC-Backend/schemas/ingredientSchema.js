const Joi = require('joi');

// Schema for creating a new ingredient (name is required)
const createIngredientSchema = Joi.object({
  name: Joi.string()
    .trim()
    .max(255)
    .required()
    .messages({
      'string.empty': 'Name is required',
      'string.max': 'Name must not exceed 255 characters',
      'any.required': 'Name is required'
    }),

  inci_name: Joi.string()
    .max(255)
    .allow(null, '')
    .messages({
      'string.max': 'INCI name must not exceed 255 characters'
    }),

  origin: Joi.string()
    .max(255)
    .allow(null, '')
    .messages({
      'string.max': 'Origin must not exceed 255 characters'
    }),

  ingredient_type: Joi.string()
    .max(100)
    .allow(null, '')
    .messages({
      'string.max': 'Ingredient type must not exceed 100 characters'
    }),

  is_humectant: Joi.boolean()
    .allow(null),

  is_emollient: Joi.boolean()
    .allow(null),

  is_occlusive: Joi.boolean()
    .allow(null),

  is_moisturizing: Joi.boolean()
    .allow(null),

  is_anhydrous: Joi.boolean()
    .allow(null),

  ph_min: Joi.number()
    .min(0)
    .max(14)
    .allow(null)
    .messages({
      'number.min': 'pH minimum must be between 0 and 14',
      'number.max': 'pH minimum must be between 0 and 14'
    }),

  ph_max: Joi.number()
    .min(0)
    .max(14)
    .allow(null)
    .when('ph_min', {
      is: Joi.number().required(),
      then: Joi.number().min(Joi.ref('ph_min')).messages({
        'number.min': 'pH maximum must be greater than or equal to pH minimum'
      })
    })
    .messages({
      'number.min': 'pH maximum must be between 0 and 14',
      'number.max': 'pH maximum must be between 0 and 14'
    }),

  solubility: Joi.string()
    .max(50)
    .allow(null, '')
    .messages({
      'string.max': 'Solubility must not exceed 50 characters'
    }),

  max_usage_rate: Joi.number()
    .positive()
    .max(100)
    .allow(null)
    .messages({
      'number.positive': 'Maximum usage rate must be greater than 0',
      'number.max': 'Maximum usage rate must not exceed 100'
    }),

  notes: Joi.string()
    .allow(null, '')
});

// Schema for updating an ingredient (name is required)
const updateIngredientSchema = Joi.object({
  name: Joi.string()
    .trim()
    .max(255)
    .required()
    .messages({
      'string.empty': 'Name is required',
      'string.max': 'Name must not exceed 255 characters',
      'any.required': 'Name is required'
    }),

  inci_name: Joi.string()
    .max(255)
    .allow(null, '')
    .messages({
      'string.max': 'INCI name must not exceed 255 characters'
    }),

  origin: Joi.string()
    .max(255)
    .allow(null, '')
    .messages({
      'string.max': 'Origin must not exceed 255 characters'
    }),

  ingredient_type: Joi.string()
    .max(100)
    .allow(null, '')
    .messages({
      'string.max': 'Ingredient type must not exceed 100 characters'
    }),

  is_humectant: Joi.boolean()
    .allow(null),

  is_emollient: Joi.boolean()
    .allow(null),

  is_occlusive: Joi.boolean()
    .allow(null),

  is_moisturizing: Joi.boolean()
    .allow(null),

  is_anhydrous: Joi.boolean()
    .allow(null),

  ph_min: Joi.number()
    .min(0)
    .max(14)
    .allow(null)
    .messages({
      'number.min': 'pH minimum must be between 0 and 14',
      'number.max': 'pH minimum must be between 0 and 14'
    }),

  ph_max: Joi.number()
    .min(0)
    .max(14)
    .allow(null)
    .when('ph_min', {
      is: Joi.number().required(),
      then: Joi.number().min(Joi.ref('ph_min')).messages({
        'number.min': 'pH maximum must be greater than or equal to pH minimum'
      })
    })
    .messages({
      'number.min': 'pH maximum must be between 0 and 14',
      'number.max': 'pH maximum must be between 0 and 14'
    }),

  solubility: Joi.string()
    .max(50)
    .allow(null, '')
    .messages({
      'string.max': 'Solubility must not exceed 50 characters'
    }),

  max_usage_rate: Joi.number()
    .positive()
    .max(100)
    .allow(null)
    .messages({
      'number.positive': 'Maximum usage rate must be greater than 0',
      'number.max': 'Maximum usage rate must not exceed 100'
    }),

  notes: Joi.string()
    .allow(null, '')
});

module.exports = {
  createIngredientSchema,
  updateIngredientSchema
};
