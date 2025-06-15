import Joi from 'joi';
import { userJoiSchema } from './user.validator.js';
import passwordComplexity from 'joi-password-complexity';

export function validateOwner(profile) {
  const schema = userJoiSchema.keys({
    role: Joi.string().valid("owner").required(),
    companyName: Joi.string().min(2).max(255).required(),
  });
  return schema.validate(profile);
}

export function validatePatch(update) {
  const schema = Joi.object({
    username: Joi.string().min(2),
    email: Joi.string().email(),
    companyName: Joi.string().min(2).max(255),
  }).min(1);
  return schema.validate(update);
}

export function validatePassword(password) {
  const schema = Joi.object({
    password: passwordComplexity().required()
  });
  return schema.validate(password);
}