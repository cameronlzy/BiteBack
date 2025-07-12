import Joi from 'joi';
import { futureDateFullOnly } from '../helpers/time.helper.js';
import { paginationSchema } from './pagination.validator.js';

export function validateEvent(event) {
    const schema = Joi.object({
        restaurant: Joi.objectId().required(),
        title: Joi.string(),
        description: Joi.string(),
        startDate: futureDateFullOnly.required(),
        endDate: futureDateFullOnly.required(),
        paxLimit: Joi.number().integer().required(),
        maxPaxPerCustomer: Joi.number().integer().min(1).optional(),
        minVisits: Joi.number().integer().min(0).optional(),
        remarks: Joi.string().custom((value, helpers) => {
            const wordCount = value.trim().split(/\s+/).length;
            if (wordCount > 50) {
                return helpers.message('Remarks must not exceed 50 words');
            }
            return value;
        }),
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
        minVisits: Joi.number().integer().min(0),
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

export function validateOwnerQuery(query) {
    const schema = paginationSchema.keys({
        status: Joi.string().valid('past', 'upcoming').default('upcoming'),
    });
    return schema.validate(query);
}