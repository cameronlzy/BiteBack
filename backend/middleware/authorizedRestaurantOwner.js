import Restaurant from '../models/restaurant.model.js';
import { wrapError } from '../helpers/response.js';

export default async function (req, res, next) {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json(wrapError('Restaurant not found'));
    if (restaurant.owner.toString() !== req.user.profile.toString()) {
        return res.status(403).json(wrapError('Restaurant not owned by owner'));
    }
    
    req.restaurant = restaurant;
    next();
}