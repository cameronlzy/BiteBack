import Joi from './joi.js';

export function validatePointsUpdate(data) {
    const schema = Joi.object({
        username: Joi.string().required(),
        change: Joi.number().integer().required(),
    });
    return schema.validate(data);
}