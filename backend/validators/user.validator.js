const Joi = require('joi');
const passwordComplexity = require('joi-password-complexity');

const userJoiSchema = Joi.object({
  username: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: passwordComplexity().required(),
});

const loginJoiSchema = Joi.object({
  email: Joi.string().email(),
  username: Joi.string().min(2),
  password: Joi.string().min(5).max(255).required(),
}).xor('email', 'username');

function validateLogin(credentials) {
  return loginJoiSchema.validate(credentials);
}

function validateCredentials(credentials) {
  const schema = Joi.object({
    email: Joi.string().email(),
    username: Joi.string().min(2),
  }).xor('email', 'username');
  return schema.validate(credentials);
}

module.exports = {
  userJoiSchema,
  validateLogin,
  validateCredentials,
};
