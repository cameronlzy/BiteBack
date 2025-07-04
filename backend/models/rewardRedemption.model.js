import mongoose from 'mongoose';

const rewardRedemptionSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerProfile', required: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    rewardItemSnapshot: {
        itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
        description: { type: String },
        category: { type: String },
        pointsRequired: { type: Number },
    },
    redeemedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'activated', 'completed', 'expired'], default: 'active' },
    code: { type: String, match: /^\d{6}$/ },
    activatedAt: { type: Date },
    usedAt: { type: Date }
}, { versionKey: false });

rewardRedemptionSchema.index({ customer: 1, restaurant: 1 });
rewardRedemptionSchema.index({ code: 1 }, { unique: true, sparse: true });

const RewardRedemption = mongoose.model('RewardRedemption', rewardRedemptionSchema);

export default RewardRedemption;