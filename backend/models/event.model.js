import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    paxLimit: { type: Number, required: true },
    maxPaxPerCustomer: { type: Number, default: 1 },
    status: { type: String, enum: ['scheduled', 'cancelled', 'completed'], default: 'scheduled' },
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
}, { versionKey: false });

eventSchema.index({ restaurant: 1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;