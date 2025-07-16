import Review from '../models/review.model.js';
import { wrapError } from '../helpers/response.js';

export default async function (req, res, next) {
    const review = await Review.findById(req.params.id).populate('restaurant');

    if (!review) return res.status(404).json(wrapError('Review not found'));

    const restaurantOwnerId = review.restaurant.owner.toString();
    if (restaurantOwnerId !== req.user.profile) {
      return res.status(403).json(wrapError("Review's restaurant does not belong to owner"));
    }

    req.restaurant = review.restaurant;
    review.restaurant = review.restaurant._id;
    req.review = review;
    next();
};
