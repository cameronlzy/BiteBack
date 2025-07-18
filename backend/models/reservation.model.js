import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
    customer: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CustomerProfile',
        required: true,
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    remarks: {
        type: String,
        validate: {
            validator: function (value) {
                if (value == null) return true;
                if (typeof value !== 'string') return false;

                // Count words
                const wordCount = value.trim().split(/\s+/).length;
                return wordCount <= 50;
            },
            message: 'Remarks must be an empty string or contain no more than 50 words.'
        }
    },
    pax: { type: Number, required: true },
    status: { type: String, enum: ['booked', 'no-show', 'cancelled', 'completed'], default: 'booked' },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
}, { versionKey: false });

reservationSchema.index({ customer: 1 });
reservationSchema.index({ customer: 1, startDate: 1 });
reservationSchema.index({ restaurant: 1 });

const Reservation = mongoose.model('Reservation', reservationSchema);

export default Reservation;