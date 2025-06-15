import Joi from 'joi';
import { dateFullOnly } from '../helpers/time.helper';

export function validateReservation(reservation) {
    const schema = Joi.object({
        user: Joi.objectId(),
        restaurant: Joi.objectId().required(),
        reservationDate: dateFullOnly.required(),
        remarks: Joi.string().allow('').custom((value, helpers) => {
            if (value.trim() === '') return value;

            const wordCount = value.trim().split(/\s+/).length;
            if (wordCount > 50) {
                return helpers.message('Remarks must not exceed 50 words');
            }
            return value;
        }).required(),
        pax: Joi.number().integer().min(1).required(),
    });
    return schema.validate(reservation);
}

export function validatePatch(update) {
    const schema = Joi.object({
        reservationDate: dateFullOnly,
        remarks: Joi.string().allow('').custom((value, helpers) => {
            if (value.trim() === '') return value;

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