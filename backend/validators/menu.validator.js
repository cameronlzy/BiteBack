import Joi from './joi.js';

export function validateItem(item) {
    const schema = Joi.object({
        restaurant: Joi.objectId().required(),
        name: Joi.string().required(),
        description: Joi.string().required(),
        price: Joi.number().min(0).required(),
        category: Joi.string().required(),
    });
    return schema.validate(item);
}

export function validatePatch(patch) {
    const schema = Joi.object({
        name: Joi.string(),
        description: Joi.string(),
        price: Joi.number().min(0),
        category: Joi.string(),
        isAvailable: Joi.boolean(),
    }).min(1);
    return schema.validate(patch);
}