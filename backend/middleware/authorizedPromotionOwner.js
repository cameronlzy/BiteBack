import Promotion from '../models/promotion.model.js';
import Restaurant from '../models/restaurant.model.js';
import { wrapError } from '../helpers/response.js';

export default async function (req, res, next) {
    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) return res.status(404).json(wrapError('Promotion not found'));
    
    const restaurant = await Restaurant.findById(promotion.restaurant);
    if (!restaurant) return res.status(404).json(wrapError('Restaurant not found'));
    if (restaurant.owner.toString() !== req.user.profile) return res.status(403).json(wrapError('Promotion not owned by owner'));
    
    req.restaurant = restaurant;
    req.promotion = promotion;
    next();
}