import MenuItem from '../models/menuItem.model.js';
import { wrapError } from '../helpers/response.js';

export default async function (req, res, next) {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json(wrapError('Menu item not found'));
    if (item.restaurant.toString() !== req.user.restaurant) return res.status(403).json(wrapError('Staff cannot access Item'));

    req.menuItem = item;
    next();
}