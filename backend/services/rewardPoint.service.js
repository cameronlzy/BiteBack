import _ from 'lodash';
import { error, success } from '../helpers/response.js';
import RewardPoint from '../models/rewardPoint.model.js';
import Restaurant from '../models/restaurant.model.js';
import User from '../models/user.model.js';
import { wrapSession } from '../helpers/transaction.helper.js';

export async function getAllPoints(authUser, query) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [points, total] = await Promise.all([
        RewardPoint.find({ customer: authUser.profile }).skip(skip).limit(limit).lean(),
        RewardPoint.countDocuments({ customer: authUser.profile }),
    ]);

    return success({
        points,
        page,
        limit,
        totalCount: total,
        totalPages: Math.ceil(total / limit)
    });
}

export async function getPointByRestaurant(authUser, restaurantId) {
    const restaurant = await Restaurant.findById(restaurantId).lean();
    if (!restaurant) return error(404, 'Restaurant not found');

    const point = await RewardPoint.findOne({ customer: authUser.profile, restaurant: restaurant._id }).lean();

    return success(point || null);
}

export async function updatePoints(restaurant, update) {
    const user = await User.findOne({ username: update.username }).lean();
    if (!user) return error(404, 'Customer not found');

    const pass = await adjustPoints(update.change, restaurant._id, user.profile);
    if (!pass) return error(400, 'Insufficient balance');

    return success(pass);
}

// helper services
export async function adjustPoints(change, restaurant, customer, session = undefined) {
    const existing = await RewardPoint.findOne({ restaurant, customer }).session(session);

    if (!existing) {
        if (change < 0) return false;

        const rewardPoint = new RewardPoint({
            restaurant,
            customer,
            points: change
        });
        await rewardPoint.save(wrapSession(session));
        return true;
    }

    const newPoints = existing.points + change;
    if (newPoints < 0) return false;

    existing.points = newPoints;
    await existing.save(wrapSession(session));

    return true;
}