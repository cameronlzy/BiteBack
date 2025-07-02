import mongoose from 'mongoose';

const rewardPointSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerProfile', required: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    points: { type: Number, default: 0 },
}, { timestamps: true, versionKey: false });

rewardPointSchema.index({ customer: 1, restaurant: 1 }, { unique: true });

const RewardPoint = mongoose.model('RewardPoint', rewardPointSchema);

export default RewardPoint;