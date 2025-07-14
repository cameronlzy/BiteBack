import Joi from './joi.js';

const itemsSchema = Joi.array().items(
    Joi.object({
        item: Joi.objectId().required(),
        quantity: Joi.number().integer().min(1).required()
    })
).min(1);

export function validateCode(code) {
    const schema = Joi.object({
        code: Joi.string().pattern(/^\d{6}$/).required(),
    });
    return schema.validate(code);
}

export function validateOrder(order) {
    const schema = Joi.object({
        type: Joi.string().valid('preorder').required(),
        restaurant: Joi.objectId().required(),
        items: itemsSchema.required(),
    });
    return schema.validate(order);
}

export function validatePatch(patch) {
    const schema = Joi.object({
        add: itemsSchema,
        update: itemsSchema,
        remove: Joi.array().items(Joi.objectId()),
    }).min(1);
    return schema.validate(patch);
}