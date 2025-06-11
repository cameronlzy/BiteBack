import mongoose from 'mongoose';

const queueEntrySchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    pax: {
        type: Number,
        required: true,
        min: 1
    },
    queueGroup: {
        type: String, 
        enum: ['small', 'medium', 'large'],
        required: true
    }, 
    status: {
        type: String,
        enum: ['waiting', 'called', 'seated', 'no-show'],
        default: 'waiting'
    },
    statusTimestamps: {
        waiting: { type: Date, default: () => new Date() },
        called: { type: Date },
        seated: { type: Date },
        noShow: { type: Date }
    }
}, { versionKey: false });

queueEntrySchema.index({ restaurant: 1, status: 1 });
queueEntrySchema.index({ customer: 1 });

const QueueEntry = mongoose.model('QueueEntry', queueEntrySchema);

export default QueueEntry;