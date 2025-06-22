import Promotion from '../models/promotion.model.js';
import Restaurant from '../models/restaurant.model.js';

export default async function (req, res, next) {
    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) return res.status(404).send('Promotion not found');

    const restaurant = await Restaurant.findById(promotion.restaurant);
    if (!restaurant) return res.status(404).send('Restaurant not found');
    if (restaurant.owner.toString() !== req.user._id) return res.status(403).send('Promotion not owned by owner');
    
    req.restaurant = restaurant;
    req.promotion = promotion;
    next();
}