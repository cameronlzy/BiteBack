const mongoose = require('mongoose');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const { dateFullOnly } = require('../utils/dateUtil');

const reservationSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
    },
    reservationDate: {
        type: Date,
        required: true
    },
    remarks: {
        type: String,
        default: "",
        validate: {
        validator: function (value) {
            if (typeof value !== 'string') return false;

            // Allow empty string
            if (value.trim() === '') return true;

            // Count words
            const wordCount = value.trim().split(/\s+/).length;
            return wordCount <= 50;
        },
        message: 'Remarks must be an empty string or contain no more than 50 words.'
        }
    },
    pax: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' }
});

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

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = { Reservation, validateReservation, validateNewReservation };