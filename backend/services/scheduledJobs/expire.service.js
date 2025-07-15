import { DateTime } from 'luxon';
import RewardRedemption from '../../models/rewardRedemption.model.js';

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
