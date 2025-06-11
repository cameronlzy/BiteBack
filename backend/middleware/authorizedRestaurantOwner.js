import Restaurant from '../models/restaurant.model.js';

export default async function (req, res, next) {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).send('Restaurant not found');
    if (restaurant.owner.toString() !== req.user._id) return res.status(403).send('Restaurant not owned by owner');
    
    req.restaurant = restaurant;
    next();
}