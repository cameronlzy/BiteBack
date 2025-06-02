const Joi = require('joi');
const { dateFullOnly } = require('../helpers/time.helper');

function validateReservation(reservation) {
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
        status: Joi.string().valid('pending', 'confirmed', 'cancelled')
    });
    return schema.validate(reservation);
}

function validateNewReservation(newReservation) {
    const schema = Joi.object({
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
    return schema.validate(newReservation);
}

module.exports = {
    validateReservation, 
    validateNewReservation,
};