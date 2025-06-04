const _ = require('lodash');
const { DateTime } = require('luxon');
const Review = require('../models/review.model');
const Restaurant = require('../models/restaurant.model');
const User = require('../models/user.model');

exports.getReviewsByRestaurant = async (restaurantId) => {
    // check if restaurant exists
    const restaurant = await Restaurant.findById(restaurantId).select('_id').lean();
    if (!restaurant) return { status: 404, body: 'Restaurant not found.' };

    // get reviews by restaurant
    const reviews = await Review.find({ restaurant: restaurant._id });
    return { status: 200, body: reviews };
};

exports.getReviewsByCustomer = async (customerId) => {
    // get reviews by customer
    const reviews = await Review.find({ customer: customerId }).lean();
    return { status: 200, body: reviews };
};

exports.getReviewById = async (reviewId) => {
    // get review
    const review = await Review.findById(reviewId).lean();
    if (!review) return { status: 404, body: 'Review not found.' };
    return { status: 200, body: review };
};

exports.createReview = async (data, user) => {
    // create review
    const review = new Review(_.pick(data, ['restaurant', 'rating', 'reviewText']));
    review.dateVisited = DateTime.fromISO(data.dateVisited, { zone: 'Asia/Singapore' }).startOf('day').toUTC().toJSDate();
    review.customer = user.profile;
    review.username = user.username;
    await review.save();
    
    return { status: 200, body: review.toObject() };
};

exports.createReply = async (data, review, authUser) => {
    // add reply to review
    review.reply = {
        owner: authUser._id,
        replyText: data.replyText
    };
    await review.save();

    return { status: 200, body: review.toObject() };
};

exports.deleteReview = async (review) => {
    // delete the review
    await Review.deleteOne({ _id: review._id });
    return { status: 200, body: review.toObject() };
};

exports.deleteReply = async (review) => {
    // delete reply
    review.reply = undefined;
    await review.save();

    return { status: 200, body: review.toObject() };
};