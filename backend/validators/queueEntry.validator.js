import Joi from 'joi';

export function validateEntry(entry) {
    const schema = Joi.object({
        restaurant: Joi.objectId().required(),
        pax: Joi.number().integer().min(1).required(),
    });
    return schema.validate(entry);
}

export function validateQueueGroup(query) {
    const schema = Joi.object({
        queueGroup: Joi.string().valid('small', 'medium', 'large').required()
    });
    return schema.validate(query);
}

export function validateStatus(status) {
    const schema = Joi.object({
        status: Joi.string().valid('seated', 'skipped').required()
    });
    return schema.validate(status);
}

export function validateToggle(toggle) {
    const schema = Joi.object({
        enabled: Joi.boolean().required()
    });
    return schema.validate(toggle);
}