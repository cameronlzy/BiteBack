import Joi from './joi.js';

export function validateCustomer(profile) {
  const schema = Joi.object({
    name: Joi.string().min(2).max(20).required(),
    contactNumber: Joi.string()
      .pattern(/^\d{8}$/)
      .required()
      .messages({
        "string.pattern.base": "Contact number must be an 8-digit number.",
        "string.empty": `"contactNumber" is required`
      }),
    emailOptOut: Joi.boolean().default(false),
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
    emailOptOut: Joi.boolean().default(false),
  }).min(1);
  return schema.validate(update);
}