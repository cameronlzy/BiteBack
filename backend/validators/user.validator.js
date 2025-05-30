const Joi = require('joi');
const passwordComplexity = require('joi-password-complexity');

const userJoiSchema = Joi.object({
  username: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: passwordComplexity().required(),
});

const loginJoiSchema = Joi.object({
  email: Joi.string().email(),
  username: Joi.string().min(3),
  password: Joi.string().min(5).max(255).required(),
}).xor('email', 'username');

function validateLogin(credentials) {
  return loginJoiSchema.validate(credentials);
}

module.exports = {
  userJoiSchema,
  validateLogin,
};
