const Joi = require('joi');
const passwordComplexity = require('joi-password-complexity');
const { userJoiSchema } = require('./user.validator');

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

function validateCustomerProfile(profile) {
  const schema = userJoiSchema.keys({
    username: Joi.string().min(2).max(20).required(),
    email: Joi.string().email().required(),
    password: passwordComplexity().required(),
    role: Joi.string().valid("customer").required(),
    name: Joi.string().min(2).max(20).required(),
    contactNumber: Joi.string()
      .pattern(/^\d{8}$/)
      .required()
      .messages({
        "string.pattern.base": "Contact number must be an 8-digit number.",
        "string.empty": `"contactNumber" is required`
      }),
    favCuisines: Joi.array()
      .items(Joi.string().valid(...cuisineList))
      .min(1)
      .required()
      .messages({
        "array.min": "Please select at least one favourite cuisine.",
      }),
  });
  return schema.validate(profile);
}

module.exports = {
    validateCustomer: validateCustomerProfile,
};