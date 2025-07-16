import Joi from './joi.js';

const validCategories = ['mains', 'appetisers', 'desserts', 'drinks', 'kids menu', 'specials'];

export function validateItem(item) {
    const schema = Joi.object({
        restaurant: Joi.objectId().required(),
        name: Joi.string().required(),
        description: Joi.string().required(),
        price: Joi.number().min(0).required(),
        category: Joi.string().valid(...validCategories).required(),
    });
    return schema.validate(item);
}

export function validatePatch(patch) {
    const schema = Joi.object({
        name: Joi.string(),
        description: Joi.string(),
        price: Joi.number().min(0),
        category: Joi.string().valid(...validCategories),
        isAvailable: Joi.boolean(),
    }).min(1);
    return schema.validate(patch);
}

export function validateInStock(stock) {
    const schema = Joi.object({
        isInStock: Joi.boolean().required(),
    });
    return schema.validate(stock);
}