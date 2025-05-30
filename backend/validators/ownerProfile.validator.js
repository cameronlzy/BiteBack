const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const { userJoiSchema } = require('./user.validator');
const { restaurantJoiSchema } = require('./restaurant.validator');

function validateOwnerProfile(profile) {
  const schema = userJoiSchema.keys({
    role: Joi.string().valid("owner").required(),
    companyName: Joi.string().min(2).max(255).required(),
    restaurants: Joi.array().items(restaurantJoiSchema).min(1).required(),
  });
  return schema.validate(profile);
}

function validateNewOwnerProfile(profile) {
  const schema = userJoiSchema.keys({
    role: Joi.string().valid("owner").required(),
    companyName: Joi.string().min(2).max(255).required(),
  });
  return schema.validate(profile);
}

module.exports = {
    validateOwner: validateOwnerProfile,
    validateNewOwner: validateNewOwnerProfile,
};