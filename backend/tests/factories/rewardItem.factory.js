import mongoose from 'mongoose';
import RewardItem from '../../models/rewardItem.model';

export function createTestRewardItem(restaurant = new mongoose.Types.ObjectId()) {
    const category = 'percentage';
    const description = 'description';
    const pointsRequired = 100;
    const stock = 10;

    const rewardItem = new RewardItem({
        restaurant, category, description, pointsRequired, stock
    });
    return rewardItem;
}