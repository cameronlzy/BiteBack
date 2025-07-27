import _ from 'lodash';
import mongoose from 'mongoose';
import RewardRedemption from '../models/rewardRedemption.model.js';
import RewardItem from '../models/rewardItem.model.js';
import { adjustPoints } from '../services/rewardPoint.service.js';
import { error, success, wrapMessage } from '../helpers/response.js';
import { DateTime } from 'luxon';
import { withTransaction, wrapSession } from '../helpers/transaction.helper.js';

export async function getAllRedemptions(authUser, query) {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const filter = {
        customer: new mongoose.Types.ObjectId(authUser.profile),
    };

    if (status && status.length > 0) {
        filter.status = { $in: status };
    }

    if (!status || status.length <= 1) {
        const [redemptions, total] = await Promise.all([
            RewardRedemption.find(filter).sort({ status: 1 }).skip(skip).limit(limit).lean(),
            RewardRedemption.countDocuments(filter),
        ]);
        return success({
            redemptions,
            page,
            limit,
            totalCount: total,
            totalPages: Math.ceil(total / limit),
        });
    }

    const redemptionsAgg = await RewardRedemption.aggregate([
        { $match: filter },
        {
            $addFields: {
                statusOrder: { $indexOfArray: [status, '$status'] }
            }
        },
        { $match: { statusOrder: { $gte: 0 } } },
        { $sort: { statusOrder: 1 } },
        { $skip: skip },
        { $limit: limit }
    ]);

    const total = await RewardRedemption.countDocuments(filter);

    return success({
        redemptions: redemptionsAgg,
        page,
        limit,
        totalCount: total,
        totalPages: Math.ceil(total / limit),
    });
}

export async function createRedemption(authUser, data) {
    return await withTransaction(async (session) => {
        const rewardItem = await RewardItem.findById(data.rewardItem).select('_id restaurant category description pointsRequired stock').session(session);
        if (!rewardItem) return error(404, 'Reward item not found');

        if (rewardItem.stock !== null) {
            if (rewardItem.stock <= 0) return error(400, 'Reward item out of stock');
            rewardItem.stock -= 1;
        }

        const passed = await adjustPoints(-rewardItem.pointsRequired, rewardItem.restaurant, authUser.profile, session);
        if (!passed) return error(400, 'Insufficient balance');

        const redemption = new RewardRedemption({
            customer: authUser.profile,
            restaurant: rewardItem.restaurant,
            rewardItemSnapshot: {
                itemId: rewardItem._id,
                category: rewardItem.category,
                description: rewardItem.description,
                pointsRequired: rewardItem.pointsRequired
            }
        });

        await redemption.save(wrapSession(session));
        await rewardItem.save(wrapSession(session));

        return success(redemption);
    });
}

export async function completeRedemption(authUser, code) {
    const rewardRedemption = await RewardRedemption.findOne({ code }).populate('restaurant');
    if (!rewardRedemption) return error(400, 'Invalid code');
    if (rewardRedemption.restaurant.staff.toString() !== authUser._id) return error(403, 'Staff cannot access reward redemption');
    if (rewardRedemption.status !== 'activated') return error(400, 'Reward redemption is not activated');

    const expired = DateTime
        .fromJSDate(rewardRedemption.activatedAt)
        .plus({ minutes: 15 }) < DateTime.utc();
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

    return success(wrapMessage('Redemption completed'));
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
        code = Math.floor(100000 + Math.random() * 900000).toString();
        exists = await RewardRedemption.exists({ code });
    }

    return code;
}
