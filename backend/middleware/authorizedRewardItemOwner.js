import RewardItem from '../models/rewardItem.model.js';
import { wrapError } from '../helpers/response.js';

export default async function (req, res, next) {
    const item = await RewardItem.findById(req.params.itemId);
    if (!item) return res.status(404).json(wrapError('Reward item not found'));
    if (req.params.id && item.restaurant.toString() !== req.params.id) return res.status(403).json(wrapError('Item does not belong to this restaurant'));

    req.rewardItem = item;
    next();
}
