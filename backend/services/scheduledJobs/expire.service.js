import { DateTime } from 'luxon';
import RewardRedemption from '../../models/rewardRedemption.model.js';
import Order from '../../models/order.model.js';

export async function expireStaleRedemptions() {
    const fifteenMinsAgo = DateTime.utc().minus({ minutes: 15 }).toJSDate();

    const result = await RewardRedemption.updateMany(
        {
            status: 'activated',
            activatedAt: { $lte: fifteenMinsAgo },
        },
        {
            $set: { status: 'expired' },
            $unset: { code: '' },
        }
    );

    return result.modifiedCount ?? 0;
}

export async function deleteStaleOrders() {
    const thirtyMinsAgo = DateTime.utc().minus({ minutes: 30 }).toJSDate();

    const result = await Order.deleteMany({
        status: 'pending',
        createdAt: { $lte: thirtyMinsAgo },
    });

    return result.deletedCount ?? 0;
}