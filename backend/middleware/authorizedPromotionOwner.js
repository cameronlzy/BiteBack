import Promotion from '../models/promotion.model.js';
import { wrapError } from '../helpers/response.js';

export default async function (req, res, next) {
    const promotion = await Promotion.findById(req.params.id).populate('restaurant');
    if (!promotion) return res.status(404).json(wrapError('Promotion not found'));
    if (!promotion.restaurant) return res.status(404).json(wrapError('Restaurant not found'));
    if (promotion.restaurant.owner.toString() !== req.user.profile) return res.status(403).json(wrapError('Promotion not owned by owner'));
    
    req.restaurant = promotion.restaurant;
    promotion.restaurant = promotion.restaurant._id;
    req.promotion = promotion;
    next();
}