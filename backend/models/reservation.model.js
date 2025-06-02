const mongoose = require('mongoose');

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
}, { versionKey: false });

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;