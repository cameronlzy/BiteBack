import MenuItem from '../models/menuItem.model.js';
import { wrapError } from '../helpers/response.js';

export default async function authorizedMenuItemOwner(req, res, next) {
    const item = await MenuItem.findById(req.params.id).populate('restaurant');
    if (!item) return res.status(404).json(wrapError('Menu item not found'));
    if (!item.restaurant) return res.status(404).json(wrapError('Restaurant not found'));
    if (item.restaurant.owner.toString() !== req.user.profile) return res.status(403).json(wrapError('Item does not belong to this restaurant'));

    req.restaurant = item.restaurant;
    item.restaurant = item.restaurant._id;
    req.menuItem = item;
    next();
}