import Joi from './joi.js';

const cuisineList = [
  'Chinese',
  'Malay',
  'Indian',
  'Peranakan',
  'Western',
  'Thai',
  'Japanese',
  'Korean',
  'Vietnamese',
  'Indonesian',
  'Filipino',
  'Middle Eastern',
  'Mexican',
  'Italian',
  'French',
  'Hawker',
  'Fusion',
  'Seafood',
  'Vegetarian',
  'Halal'
];

export function validateCustomer(profile) {
  const schema = Joi.object({
    username: Joi.string().min(2).required(),
    name: Joi.string().min(2).max(20).required(),
    contactNumber: Joi.string()
      .pattern(/^\d{8}$/)
      .required()
      .messages({
        "string.pattern.base": "Contact number must be an 8-digit number.",
        "string.empty": `"contactNumber" is required`
      }),
  });
  return schema.validate(profile);
}

export function validatePatch(update) {
  const schema = Joi.object({
    username: Joi.string().min(2),
    email: Joi.string().email(),
    name: Joi.string().min(2).max(20),
    contactNumber: Joi.string()
      .pattern(/^\d{8}$/)
      .messages({
        "string.pattern.base": "Contact number must be an 8-digit number.",
        "string.empty": `"contactNumber" is required`
      }),
    favCuisines: Joi.array()
      .items(Joi.string().valid(...cuisineList))
      .min(1)
      .messages({
        "array.min": "Please select at least one favourite cuisine.",
      }),
  }).min(1);
  return schema.validate(update);
}