import _ from 'lodash';
import { DateTime } from 'luxon';
import Review from '../models/review.model.js';
import Restaurant from '../models/restaurant.model.js';
import ReviewBadgeVote from '../models/reviewBadgeVote.model.js';
import CustomerProfile from '../models/customerProfile.model.js';
import mongoose from 'mongoose';
import { deleteImagesFromDocument } from './image.service.js';
import { withTransaction, wrapSession } from '../helpers/transaction.helper.js';

export async function getReviewsByRestaurant(restaurantId, authUser) {
    // check if restaurant exists
    const restaurant = await Restaurant.findById(restaurantId).select('_id').lean();
    if (!restaurant) return { status: 404, body: 'Restaurant not found' };

    // get reviews by restaurant
    let reviews = await Review.find({ restaurant: restaurant._id }).lean();
    if (Array.isArray(reviews) && reviews.length === 0) return { status: 200, body: reviews };

    // get badges count
    reviews = await getBadgesCount(reviews);

    // get user badge votes
    if (authUser) reviews = await getUserBadgeVotes(reviews, authUser);

    return { status: 200, body: reviews };
}

export async function getReviewsByCustomer(customerId, authUser) {
    // find customer profile
    const customer = await CustomerProfile.findById(customerId);
    if (!customer) return { status: 404, body: 'Customer profile not found' };

    // get reviews by customer
    let reviews = await Review.find({ customer: customerId }).lean();
    if (Array.isArray(reviews) && reviews.length === 0) return { status: 200, body: reviews };

    // get badges count
    reviews = await getBadgesCount(reviews);

    // get user badge votes
    if (authUser) reviews = await getUserBadgeVotes(reviews, authUser);

    return { status: 200, body: reviews };
}

export async function getReviewById(reviewId) {
    // get review
    const review = await Review.findById(reviewId).lean();
    if (!review) return { status: 404, body: 'Review not found.' };
    return { status: 200, body: review };
}

export async function createReview(data, user) {
    return await withTransaction(async (session) => {
        // create review
        const review = new Review(_.pick(data, ['restaurant', 'rating', 'reviewText']));
        review.dateVisited = DateTime.fromISO(data.dateVisited, { zone: 'Asia/Singapore' }).startOf('day').toUTC().toJSDate();
        review.customer = user.profile;
        review.username = user.username;
        await review.save(wrapSession(session));

        // update restaurant ratings
        await updateRatingForRestaurant(review.restaurant, review.rating, 1, session);

        return { status: 200, body: review.toObject() };
    });
}

export async function createReply(data, review, authUser) {
    // add reply to review
    review.reply = {
        owner: authUser._id,
        replyText: data.replyText
    };
    await review.save();

    return { status: 200, body: review.toObject() };
}

export async function addBadge(data, reviewId, authUser) {
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
}

export async function deleteReview(review) {
    return await withTransaction(async (session) => {
        // delete the review and associations
        await deleteReviewAndAssociations(review, session);

        return { status: 200, body: review.toObject() };
    });
}

export async function deleteReply(review) {
    // delete reply
    review.reply = undefined;
    await review.save();

    return { status: 200, body: review.toObject() };
}

export async function deleteBadge(reviewId, authUser) {
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
}

// utlity services
export async function getBadgesCount(reviews) {
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

export async function getUserBadgeVotes(reviews, user) {
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
}

export async function getAverageRatingsForRestaurants(restaurants) {
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
}

export async function updateRatingForRestaurant(restaurantId, ratingChange, countChange, session = undefined) {
    // get restaurant
    const restaurant = await Restaurant.findById(restaurantId);

    // recalculate
    let { averageRating = 0, reviewCount = 0 } = restaurant;

    if (countChange < 0 && reviewCount <= 1) {
        averageRating = 0;
        reviewCount = 0;
    } else {
        averageRating = ((averageRating * reviewCount) + ratingChange) / (reviewCount + countChange);
        reviewCount += countChange;
    }

    // round to 3 dp
    averageRating = Math.round(averageRating * 1000) / 1000;

    restaurant.averageRating = averageRating;
    restaurant.reviewCount = reviewCount;

    await restaurant.save(session ? { session } : undefined);
}

export async function deleteReviewAndAssociations(review, session = undefined) {
    // delete images
    await deleteImagesFromDocument(review, 'images');

    // delete reviews and it's associations
    await Promise.all([
        ReviewBadgeVote.deleteMany({ review: review._id }).session(session),
        updateRatingForRestaurant(review.restaurant, -1 * review.rating, -1, session)
    ]);

    // delete review after children deleted
    await Review.deleteOne({ _id: review._id }).session(session);
}
