import Restaurant from '../models/restaurant.model.js';
import { wrapError } from '../helpers/response.js';

export default async function (req, res, next) {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json(wrapError('Restaurant not found'));
    if (restaurant.staff.toString() !== req.user._id) return res.status(403).json(wrapError('Staff is not linked to restaurant'));
    
    req.restaurant = restaurant;
    next();
}