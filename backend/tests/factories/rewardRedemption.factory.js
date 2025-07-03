import mongoose from 'mongoose';
import _ from 'lodash';
import RewardRedemption from '../../models/rewardRedemption.model.js';

export function createTestRewardRedemption(
    customer = new mongoose.Types.ObjectId(),
    restaurant = new mongoose.Types.ObjectId(),
    rewardItem = {
        _id: new mongoose.Types.ObjectId(),
        description: 'description',
        category: 'percentage',
        pointsRequired: 100
    }
) {
    const rewardItemSnapshot = _.pick(rewardItem, ['description', 'category', 'pointsRequired']);
    rewardItemSnapshot.itemId = rewardItem._id;

    const rewardRedemption = new RewardRedemption({
        customer, restaurant, rewardItemSnapshot
    });
    return rewardRedemption;
}