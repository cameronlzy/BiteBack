const Restaurant = require('../models/restaurant.model');

module.exports = async function (req, res, next) {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).send('Restaurant not found');
    if (restaurant.staff.toString() !== req.user._id) return res.status(403).send('Staff is not linked to restaurant');
    
    req.restaurant = restaurant;
    next();
}