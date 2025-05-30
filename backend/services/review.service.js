const _ = require('lodash');
const { DateTime } = require('luxon');
const Review = require('../models/review.model');
const { validateReview } = require('../validators/review.validator');
const Restaurant = require('../models/restaurant.model');
const User = require('../models/user.model');

exports.fetchReviewsByRestaurant = async (restaurantId) => {
    // check if restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return { status: 404, body: 'Restaurant not found.' };

    // get reviews by restaurant
    const reviews = await Review.find({ restaurant: restaurant._id });
    return { status: 200, body: reviews };
};

exports.fetchReviewsByCustomer = async (userId) => {
    // check if customer exists
    const user = await User.findById(userId).populate('profile');
    if (!user) return { status: 404, body: 'User not found.' };

    // get reviews by customer
    const reviews = await Review.find({ customer: user.profile._id });
    return { status: 200, body: reviews };
};

exports.fetchReviewById = async (reviewId) => {
    // get review
    const review = await Review.findById(reviewId);
    if (!review) return { status: 404, body: 'Review not found.' };
    return { status: 200, body: review };
};

exports.createReview = async (data, user) => {
    // validate request
    const { error } = validateReview(data);
    if (error) return { status: 400, body: error.details[0].message };

    // create review
    const review = new Review(_.pick(data, ['restaurant', 'rating', 'reviewText']));
    review.dateVisited = DateTime.fromISO(data.dateVisited, { zone: 'Asia/Singapore' }).toUTC().toJSDate();
    review.customer = user.profile;
    review.username = user.username;
    await review.save();
    
    return { status: 200, body: review };
};

exports.deleteReview = async (reviewId, authUser) => {
    // validate request
    const review = await Review.findById(reviewId);
    if (!review) return { status: 404, body: 'Review not found.' };

    // get user
    const user = await User.findById(authUser._id);
    if (!user) return { status: 404, body: 'Customer not found.' };

    // check if review belongs to the logged-in customer
    if (!review.customer.equals(user.profile)) return { status: 403, body: 'Access denied. You can only delete your own reviews.' };

    // delete the review
    await Review.deleteOne({ _id: reviewId });
    return { status: 200, body: review };
};