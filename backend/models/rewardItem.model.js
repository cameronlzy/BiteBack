import mongoose from 'mongoose';

const rewardItemSchema = new mongoose.Schema({
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    pointsRequired: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    stock: { type: Number, default: null } // null means unlimited
}, { timestamps: true, versionKey: false });

rewardItemSchema.index({ restaurant: 1 });
rewardItemSchema.index({ restaurant: 1, isActive: 1 });

const RewardItem = mongoose.model('RewardItem', rewardItemSchema);

export default RewardItem;