const Joi = require('joi');
const { userJoiSchema } = require('./user.validator');
const passwordComplexity = require('joi-password-complexity');

function validateOwnerProfile(profile) {
  const schema = userJoiSchema.keys({
    role: Joi.string().valid("owner").required(),
    companyName: Joi.string().min(2).max(255).required(),
  });
  return schema.validate(profile);
}

function validateOwnerPatch(update) {
  const schema = Joi.object({
    username: Joi.string().min(2),
    email: Joi.string().email(),
    password: passwordComplexity(),
    companyName: Joi.string().min(2).max(255),
  }).min(1);
  return schema.validate(update);
}

module.exports = {
    validateOwner: validateOwnerProfile,
    validatePatch: validateOwnerPatch,
};