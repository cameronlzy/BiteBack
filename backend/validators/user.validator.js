import Joi from 'joi';
import passwordComplexity from 'joi-password-complexity';

export const userJoiSchema = Joi.object({
  username: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: passwordComplexity().required(),
});

const loginJoiSchema = Joi.object({
  email: Joi.string().email(),
  username: Joi.string().min(2),
  password: passwordComplexity().required(),
}).xor('email', 'username');

export function validateLogin(credentials) {
  return loginJoiSchema.validate(credentials);
}

export function validateCredentials(credentials) {
  const schema = Joi.object({
    email: Joi.string().email(),
    username: Joi.string().min(2),
  }).xor('email', 'username');
  return schema.validate(credentials);
}

export function validatePassword(password) {
  const schema = Joi.object({
    password: passwordComplexity().required(),
  });
  return schema.validate(password);
}

export function validatePasswordChange(change) {
  const schema = Joi.object({
    oldPassword: passwordComplexity().required(),
    password: passwordComplexity().required(),
  });
  return schema.validate(change);
}
