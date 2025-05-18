const mongoose = require('mongoose');
const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

const reservationSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'User',
        required: true,
    },
    reservationDate: {
        type: Date,
        required: true
    },
    pax: { type: Number, required: true },
});

function validateReservation(reservation) {
    const schema = Joi.object({
        user: Joi.objectId().required(),
        reservation: Joi.date().required(),
        pax: Joi.number().integer().required()
    });
    return schema.validate(reservation);
}

const Reservation = mongoose.model('Reservation', reservationSchema);

exports.Reservation = Reservation;
exports.validateReservation = validateReservation;