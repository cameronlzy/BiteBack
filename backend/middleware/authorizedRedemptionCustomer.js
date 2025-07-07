import { wrapError } from '../helpers/response.js';
import RewardRedemption from '../models/rewardRedemption.model.js';

export default async function (req, res, next) {
    const redemption = await RewardRedemption.findById(req.params.id);
    if (!redemption) return res.status(404).json(wrapError('Reward redemption not found'));

    if (redemption.customer.toString() !== req.user.profile) return res.status(403).json(wrapError('Reward Redemption does not belong to customer'));

    req.rewardRedemption = redemption;
    next();
}