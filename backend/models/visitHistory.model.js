import mongoose from 'mongoose';

const visitHistorySchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    visits: [
        {
            visitDate: { type: Date, required: true },
            reviewed: { type: Boolean, default: false },
        }
    ],
}, { versionKey: false });

visitHistorySchema.index({ customer: 1, restaurant: 1 }, { unique: true });

const VisitHistory = mongoose.model('VisitHistory', visitHistorySchema);

export default VisitHistory;
