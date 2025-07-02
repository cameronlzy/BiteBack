import mongoose from 'mongoose';

const rewardRedemptionSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerProfile', required: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    rewardItem: { type: mongoose.Schema.Types.ObjectId, ref: 'RewardItem', required: true },
    redeemedAt: { type: Date, default: Date.now },
}, { versionKey: false });

rewardRedemptionSchema.index({ customer: 1, restaurant: 1 });

const RewardRedemption = mongoose.model('RewardRedemption', rewardRedemptionSchema);

export default RewardRedemption;