import Joi from 'joi';
import { futureDateFullOnly } from '../helpers/time.helper.js';

export function validateEvent(event) {
    const schema = Joi.object({
        restaurant: Joi.objectId().required(),
        title: Joi.string(),
        description: Joi.string(),
        startDate: futureDateFullOnly.required(),
        endDate: futureDateFullOnly.required(),
        paxLimit: Joi.number().integer().required(),
        maxPaxPerCustomer: Joi.number().integer().min(1),
        remarks: Joi.string().allow('').custom((value, helpers) => {
            if (value.trim() === '') return value;

            const wordCount = value.trim().split(/\s+/).length;
            if (wordCount > 50) {
                return helpers.message('Remarks must not exceed 50 words');
            }
            return value;
        }).required(),
    });
    return schema.validate(event);
}

export function validatePatch(patch) {
    const schema = Joi.object({
        title: Joi.string(),
        description: Joi.string(),
        startDate: futureDateFullOnly,
        endDate: futureDateFullOnly,
        paxLimit: Joi.number().integer(),
        maxPaxPerCustomer: Joi.number().integer().min(1),
        remarks: Joi.string().allow('').custom((value, helpers) => {
            if (value.trim() === '') return value;

            const wordCount = value.trim().split(/\s+/).length;
            if (wordCount > 50) {
                return helpers.message('Remarks must not exceed 50 words');
            }
            return value;
        })
    });
    return schema.validate(patch);
}