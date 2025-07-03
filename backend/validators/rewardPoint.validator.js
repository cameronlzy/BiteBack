import Joi from 'joi';

export function validatePointsUpdate(data) {
    const schema = Joi.object({
        username: Joi.string().required(),
        change: Joi.number().integer().required(),
    });
    return schema.validate(data);
}