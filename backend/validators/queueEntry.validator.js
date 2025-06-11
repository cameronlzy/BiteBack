import Joi from 'joi';

export function validateEntry(entry) {
    const schema = Joi.object({
        restaurant: Joi.objectId().required(),
        pax: Joi.number().integer().min(1).required(),
    });
    return schema.validate(entry);
}