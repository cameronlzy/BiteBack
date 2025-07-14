import Joi from './joi.js';

export function validateItem(item) {
    const schema = Joi.object({
        category: Joi.string().valid('percentage', 'monetary', 'freeItem', 'buyXgetY').required(),
        description: Joi.string().required(),
        pointsRequired: Joi.number().integer().required(),
        stock: Joi.number().integer().optional(),
    });
    return schema.validate(item);
}

export function validatePatch(update) {
    const schema = Joi.object({
        description: Joi.string(),
        pointsRequired: Joi.number().integer(),
        stock: Joi.number().integer(),
        isActive: Joi.boolean(),
        isDeleted: Joi.boolean(),
    });
    return schema.validate(update);
}