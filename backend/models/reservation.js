const mongoose = require('mongoose');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);
const { DateTime } = require('luxon');
const { dateFullOnly } = require('../utils/dateUtil');

const reservationSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'User',
        required: true,
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'Restaurant',
        required: true,
    },
    reservationDate: {
        type: Date,
        required: true
    },
    pax: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' }
});



function validateReservation(reservation) {
    const schema = Joi.object({
        user: Joi.objectId(),
        restaurant: Joi.objectId().required(),
        reservationDate: dateFullOnly.required(),
        pax: Joi.number().integer().min(1).required(),
        status: Joi.string().valid('pending', 'confirmed', 'cancelled')
    });
    return schema.validate(reservation);
}

function validateNewReservation(newReservation) {
    const schema = Joi.object({
        newReservationDate: dateFullOnly.required(),
        newPax: Joi.number().integer().min(1).required(),
    });
    return schema.validate(newReservation);
}

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = { Reservation, validateReservation, validateNewReservation };