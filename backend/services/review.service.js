const _ = require('lodash');
const { DateTime } = require('luxon');
const Review = require('../models/review.model');
const Restaurant = require('../models/restaurant.model');
const ReviewBadgeVote = require('../models/reviewBadgeVote.model');
const CustomerProfile = require('../models/customerProfile.model');
const mongoose = require('mongoose');

const isProdEnv = process.env.NODE_ENV === 'production';

exports.getReviewsByRestaurant = async (restaurantId, authUser) => {
    // check if restaurant exists
    const restaurant = await Restaurant.findById(restaurantId).select('_id').lean();
    if (!restaurant) return { status: 404, body: 'Restaurant not found' };

    // get reviews by restaurant
    let reviews = await Review.find({ restaurant: restaurant._id }).lean();
    if (Array.isArray(reviews) && reviews.length === 0) return { status: 200, body: reviews };

    // get badges count
    reviews = await this.getBadgesCount(reviews);

    // get user badge votes
    if (authUser) reviews = await this.getUserBadgeVotes(reviews, authUser);

    return { status: 200, body: reviews };
};

exports.getReviewsByCustomer = async (customerId, authUser) => {
    // find customer profile
    const customer = await CustomerProfile.findById(customerId);
    if (!customer) return { status: 404, body: 'Customer profile not found' };

    // get reviews by customer
    let reviews = await Review.find({ customer: customerId }).lean();
    if (Array.isArray(reviews) && reviews.length === 0) return { status: 200, body: reviews };

    // get badges count
    reviews = await this.getBadgesCount(reviews);

    // get user badge votes
    if (authUser) reviews = await this.getUserBadgeVotes(reviews, authUser);

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

exports.addBadge = async(data, reviewId, authUser) => {
    // find review
    const review = await Review.findById(reviewId).lean();
    if (!review) return { status: 404, body: 'Review with this ID not found' };

    // check if customer has made a badgeVote for this review
    const badgeVote = await ReviewBadgeVote.findOne({
        customer: authUser.profile,
        review: review._id
    });

    // if it exists, change the vote
    if (badgeVote) {
        badgeVote.badgeIndex = data.badgeIndex;
        await badgeVote.save();
    } else {
        const newBadgeVote = new ReviewBadgeVote({
            customer: authUser.profile,
            review: review._id,
            restaurant: review.restaurant,
            badgeIndex: data.badgeIndex
        });
        await newBadgeVote.save();
    }

    return { status: 200, body: data.badgeIndex };
};

exports.deleteReview = async (review) => {
    const session = isProdEnv ? await mongoose.startSession() : null;
    if (session) session.startTransaction();

    try {
        // delete the review + votes
        await Promise.all([
            Review.deleteOne({ _id: review._id }).session(session || null),
            ReviewBadgeVote.deleteMany({ review: review._id }).session(session || null)
        ]);

        if (session) await session.commitTransaction();
        return { status: 200, body: review.toObject() };
    } catch (err) {
        if (session) await session.abortTransaction();
        throw err;
    } finally {
        if (session) session.endSession();
    }
};

exports.deleteReply = async (review) => {
    // delete reply
    review.reply = undefined;
    await review.save();

    return { status: 200, body: review.toObject() };
};

exports.deleteBadge = async(reviewId, authUser) => {
    // find review
    const review = await Review.findById(reviewId).lean();
    if (!review) return { status: 404, body: 'Review with this ID not found' };

    // find badgeVote
    const badgeVote = await ReviewBadgeVote.findOne({
        customer: authUser.profile,
        review: review._id
    });
    if (!badgeVote) return { status: 404, body: 'Vote does not exist' };
    const badgeIndex = badgeVote.badgeIndex;
    await badgeVote.deleteOne();

    return { status: 200, body: badgeIndex };
};

// utlity services
exports.getBadgesCount = async (reviews) => {
    const reviewIds = reviews.map((r) => r._id);

    // aggregtate badge votes
    const badgeData = await ReviewBadgeVote.aggregate([
        { $match: { review: { $in: reviewIds } } },
        {
            $group: {
                _id: { review: '$review', badgeIndex: '$badgeIndex' },
                count: { $sum: 1 }
            }
        }
    ]);

    const badgeMap = {};
    for (const { _id, count } of badgeData) {
        const reviewId = _id.review.toString();
        const badgeIndex = _id.badgeIndex;
        if (!badgeMap[reviewId]) badgeMap[reviewId] = [0, 0, 0, 0];
        badgeMap[reviewId][badgeIndex] = count;
    }

    // attaching badge count to review
    return reviews.map((r) => ({
        ...r,
        badgesCount: badgeMap[r._id.toString()] || [0, 0, 0, 0]
    }));
}

exports.getUserBadgeVotes = async (reviews, user) => {
    const reviewIds = reviews.map(r => r._id);

    const votes = await ReviewBadgeVote.find({
    review: { $in: reviewIds },
    customer: user.profile
    }).select('review badgeIndex');

    const voteMap = {};
    for (const vote of votes) {
    voteMap[vote.review.toString()] = vote.badgeIndex;
    }

    return reviews.map(r => ({
    ...r,
    selectedBadge: voteMap[r._id.toString()] ?? null
    }));
};

exports.getAverageRatingsForRestaurants = async (restaurants) => {
    const restaurantIds = restaurants.map(r => r._id);

    const ratings = await Review.aggregate([
        { $match: { restaurant: { $in: restaurantIds } } },
        {
            $group: {
            _id: '$restaurant',
            averageRating: { $avg: '$rating' },
            reviewCount: { $sum: 1 }
            }
        }
    ]);

    const ratingMap = {};
    for (const { _id, averageRating, reviewCount } of ratings) {
        ratingMap[_id.toString()] = {
            averageRating: Math.round(averageRating * 10) / 10,
            reviewCount
        };
    }

    // attach to original restaurants
    return restaurants.map(r => ({
            ...r,
            averageRating: ratingMap[r._id.toString()]?.averageRating || 0,
            reviewCount: ratingMap[r._id.toString()]?.reviewCount || 0
    }));
};
