import mongoose from 'mongoose';
import RewardPoint from '../../models/rewardPoint.model.js';

export function createTestRewardPoint(restaurant = new mongoose.Types.ObjectId(), customer = new mongoose.Types.ObjectId()) {
    const points = 100;
    
    const rewardPoint = new RewardPoint({
        restaurant, customer, points
    });
    return rewardPoint;
}