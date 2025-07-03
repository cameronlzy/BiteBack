import _ from 'lodash';
import RewardRedemption from '../models/rewardRedemption.model.js';
import RewardItem from '../models/rewardItem.model.js';
import { error, success } from '../helpers/response.js';
import { DateTime } from 'luxon';

export async function getAllRedemptions(authUser, query) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [redemptions, total] = await Promise.all([
        RewardRedemption.find({ customer: authUser.profile }).skip(skip).limit(limit).lean(),
        RewardRedemption.countDocuments({ customer: authUser.profile }),
    ]);

    return success({
        redemptions,
        page,
        limit,
        totalCount: total,
        totalPages: Math.ceil(total / limit)
    });
}

export async function createRedemption(authUser, data) {
    const rewardItem = await RewardItem.findById(data.rewardItem).select('_id restaurant category description pointsRequired').lean();
    if (!rewardItem) return error(404, 'Reward item not found');

    const redemption = new RewardRedemption();
    redemption.customer = authUser.profile;
    redemption.restaurant = rewardItem.restaurant;
    redemption.rewardItemSnapshot = {
        itemId: rewardItem._id,
        category: rewardItem.category,
        description: rewardItem.description,
        pointsRequired: rewardItem.pointsRequired
    };

    await redemption.save();

    return success(redemption);
}

export async function completeRedemption(authUser, code) {
    const rewardRedemption = await RewardRedemption.findOne({ code }).populate('restaurant');
    if (!rewardRedemption) return error(400, 'Invalid code');
    if (rewardRedemption.restaurant.staff.toString() !== authUser._id) return error(403, 'Staff cannot access reward redemption');
    if (rewardRedemption.status !== 'activated') return error(400, 'Reward redemption is not activated');

    const expired = DateTime
        .fromJSDate(rewardRedemption.activatedAt)
        .plus({ minutes: 15 }) < DateTime.now();
    if (expired) {
        rewardRedemption.status = 'expired';
        rewardRedemption.code = undefined;
        await rewardRedemption.save();
        return error(410, 'Reward redemption has expired');
    }

    rewardRedemption.status = 'completed';
    rewardRedemption.usedAt = new Date();
    rewardRedemption.code = undefined;
    await rewardRedemption.save();

    return success({ message: 'Redemption completed'});
}

export async function activateRedemption(rewardRedemption) {
    rewardRedemption.status = 'activated';
    rewardRedemption.activatedAt = new Date();

    rewardRedemption.code = await generateUniqueCode();

    await rewardRedemption.save();

    return success(rewardRedemption.toObject());
}

// helper service
async function generateUniqueCode() {
    let code;
    let exists = true;

    while (exists) {
        code = Math.floor(100000 + Math.random() * 900000);
        exists = await RewardRedemption.exists({ code });
    }

    return code;
}
