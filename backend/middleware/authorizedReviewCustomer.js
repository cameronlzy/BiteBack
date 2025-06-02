const Review = require('../models/review.model');

module.exports = async function (req, res, next) {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    if (review.customer.toString() !== req.user.profile) return res.status(403).json({ message: 'Review does not belong to customer' });
    
    req.review = review;
    next();
}