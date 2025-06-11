import Review from '../models/review.model.js';

export default async function (req, res, next) {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).send('Review not found');
    if (review.customer.toString() !== req.user.profile) return res.status(403).send('Review does not belong to customer');
    
    req.review = review;
    next();
}