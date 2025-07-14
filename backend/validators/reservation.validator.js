import Joi from 'joi';
import { futureDateFullOnly } from '../helpers/time.helper.js';

export function validateReservation(reservation) {
    const schema = Joi.object({
        customer: Joi.objectId(),
        restaurant: Joi.objectId().required(),
        startDate: futureDateFullOnly.required(),
        remarks: Joi.string().optional().custom((value, helpers) => {
            const trimmed = value.trim();
            if (trimmed === '') return helpers.message('"remarks" must not be empty');
            const wordCount = trimmed.split(/\s+/).length;
            if (wordCount > 50) {
                return helpers.message('Remarks must not exceed 50 words');
            }
            return value;
        }),
        pax: Joi.number().integer().min(1).required(),
        event: Joi.objectId().optional(),
    });
    return schema.validate(reservation);
}

export function validatePatch(update) {
    const schema = Joi.object({
        startDate: futureDateFullOnly,
        remarks: Joi.string().custom((value, helpers) => {
            const wordCount = value.trim().split(/\s+/).length;
            if (wordCount > 50) {
                return helpers.message('Remarks must not exceed 50 words');
            }
            return value;
        }),
        pax: Joi.number().integer().min(1),
    }).min(1);
    return schema.validate(update);
}

export function validateStatus(status) {
    const schema = Joi.object({
        status: Joi.string().valid('completed', 'no-show').required()
    });
    return schema.validate(status);
}