import Review from '../models/review.model.js';

export default async function checkReviewOwnership(req, res, next) {
    const review = await Review.findById(req.params.id).populate('restaurant');

    if (!review) return res.status(404).send('Review not found');

    const restaurantOwnerId = review.restaurant.owner.toString();
    if (restaurantOwnerId !== req.user._id) {
      return res.status(403).send("Review's restaurant does not belong to owner");
    }
    req.review = review;
    req.restaurant = review.restaurant;
    next();
};
