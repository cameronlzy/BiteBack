import _ from 'lodash';
import { error, success } from '../helpers/response.js';
import RewardItem from '../models/rewardItem.model.js';

export async function getAllItems(restaurant, query) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        RewardItem.find({ restaurant, isDeleted: false }).skip(skip).limit(limit).lean(),
        RewardItem.countDocuments({ restaurant, isDeleted: false }),
    ]);

    return success({
        items,
        page,
        limit,
        totalCount: total,
        totalPages: Math.ceil(total / limit)
    });
}

export async function getItemById(itemId) {
    const item = await RewardItem.findById(itemId).lean();
    if (!item) return error(404, 'Item not found');
    if (item.isDeleted) return error(404, 'Item has been deleted');
    return success(item);
}

export async function createItem(data, restaurant) {
    const rewardItem = new RewardItem(_.pick(data, ['category', 'description', 'pointsRequired', 'stock']));
    rewardItem.restaurant = restaurant._id;
    await rewardItem.save();

    return success(rewardItem);
}

export async function updateItem(update, rewardItem) {
    for (const key in update) {
        if (update[key] !== undefined) {
            rewardItem[key] = update[key];
        }
    }
    await rewardItem.save();
    return success(rewardItem.toObject());
}

export async function deleteItem(rewardItem) {
    rewardItem.isDeleted = true;
    rewardItem.isActive = false;
    await rewardItem.save();
    return success(rewardItem.toObject());
}