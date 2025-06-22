import Promotion from '../models/promotion.model.js';

export default async function (req, res, next) {
    const promotion = await Promotion.findById(req.params.id).populate('restaurant');
    if (!promotion) return res.status(404).send('Promotion not found');
    if (promotion.restaurant.owner.toString() !== req.user._id) return res.status(403).send('Promotion not owned by owner');
    
    req.restaurant = promotion.restaurant;
    req.promotion = promotion;
    next();
}