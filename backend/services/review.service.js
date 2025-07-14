import _ from 'lodash';
import { DateTime } from 'luxon';
import Review from '../models/review.model.js';
import Restaurant from '../models/restaurant.model.js';
import ReviewBadgeVote from '../models/reviewBadgeVote.model.js';
import CustomerProfile from '../models/customerProfile.model.js';
import VisitHistory from '../models/visitHistory.model.js';
import { adjustPoints } from './rewardPoint.service.js';
import { deleteImagesFromDocument } from './image.service.js';
import { withTransaction, wrapSession } from '../helpers/transaction.helper.js';
import { error, success } from '../helpers/response.js';
import { updateVisitReviewedStatus } from './visitHistory.service.js';

export async function getEligibleVisits(restaurantId, authUser) {
    // check if restaurant exists
    const restaurant = await Restaurant.findById(restaurantId).select('_id').lean();
    if (!restaurant) return { status: 404, body: 'Restaurant not found' };

    // get visits by customer in restaurant
    const visitHistory = await VisitHistory.findOne({ customer: authUser.profile, restaurant: restaurant._id }).select('visits').lean();
    if (!visitHistory || visitHistory.visits.length === 0) return success([]);

    // filter out reviewed visits
    const unreviewedVisits = visitHistory.visits
        .filter(v => !v.reviewed)
        .map(v => ({ visitDate: v.visitDate }))
        .sort((a, b) => new Date(a.visitDate) - new Date(b.visitDate));

    return success(unreviewedVisits);
}

export async function getReviewsByRestaurant(restaurantId, authUser, query) {
    const { page, limit, sortBy, order } = query;
    const skip = (page - 1) * limit;

    // check if restaurant exists
    const restaurant = await Restaurant.findById(restaurantId).select('_id').lean();
    if (!restaurant) return error(404, 'Restaurant not found');

    // get reviews by restaurant
    let [reviews, total] = await Promise.all([
        Review.find({ restaurant: restaurant._id }).populate('customer', 'username').sort({ [sortBy]: order === 'asc' ? 1 : -1 }).skip(skip).limit(limit).lean(),
        Review.countDocuments({ restaurant: restaurant._id }),
    ]);

    if (Array.isArray(reviews) && reviews.length === 0) {
        return success({
            reviews: [],
            page,
            limit,
            totalCount: 0,
            totalPages: 0,
        });
    }

    reviews = reviews.map(r => {
        return {
            ...r,
            username: r.customer.username,
            customer: r.customer._id
        };
    });

    // get badges count
    reviews = await getBadgesCount(reviews);

    // get user badge votes
    if (authUser) reviews = await getUserBadgeVotes(reviews, authUser);

    return success({
        reviews,
        page,
        limit,
        totalCount: total,
        totalPages: Math.ceil(total / limit)
    });
}

export async function getReviewsByCustomer(customerId, authUser, query) {
    const { page, limit, sortBy, order } = query;
    const skip = (page - 1) * limit;

    // find customer profile
    const customer = await CustomerProfile.findById(customerId).lean();
    if (!customer) return error(404, 'Customer profile not found');

    // get reviews by customer
    let [reviews, total] = await Promise.all([
        Review.find({ customer: customerId }).populate('customer', 'username').sort({ [sortBy]: order === 'asc' ? 1 : -1 }).skip(skip).limit(limit).lean(),
        Review.countDocuments({ customer: customerId }),
    ])

    if (Array.isArray(reviews) && reviews.length === 0) {
        return success({
            reviews: [],
            page,
            limit,
            totalCount: 0,
            totalPages: 0,
        });
    }

    reviews = reviews.map(r => {
        return {
            ...r,
            username: r.customer.username,
            customer: r.customer._id
        };
    });

    // get badges count
    reviews = await getBadgesCount(reviews);

    // get user badge votes
    if (authUser) reviews = await getUserBadgeVotes(reviews, authUser);

    return success({
        reviews,
        page,
        limit,
        totalCount: total,
        totalPages: Math.ceil(total / limit)
    });
}

export async function getReviewById(reviewId) {
    // get review
    const review = await Review.findById(reviewId).populate('customer', 'username').lean();
    if (!review) return error(404, 'Review not found');
    review.username = review.customer.username;
    review.customer = review.customer._id;
    return success(review);
}

export async function createReview(data, user) {
    return await withTransaction(async (session) => {
        const restaurant = await Restaurant.findById(data.restaurant).select('timezone').lean();
        if (!restaurant) return error(404, 'Restaurant not found');

        const visitDate = DateTime.fromISO(data.dateVisited, { zone: restaurant.timezone }).toUTC().toJSDate();

        // validate eligibility
        const visitHistory = await VisitHistory.findOne(
            {
                customer: user.profile,
                restaurant: data.restaurant,
                visits: { $elemMatch: { visitDate } }
            },
            { 'visits.$': 1 }
        ).session(session).lean();

        if (!visitHistory || visitHistory.visits.length === 0) return error(400, 'Visit not found for selected date');

        const visit = visitHistory.visits[0];
        if (visit.reviewed) return error(400, 'Visit has already been reviewed');

        // create review
        const review = new Review(_.pick(data, ['restaurant', 'rating']));
        if (data.reviewText) review.reviewText = data.reviewText;
        review.dateVisited = visitDate;
        review.customer = user.profile;
        await review.save(wrapSession(session));

        // update restaurant ratings
        await updateRatingForRestaurant(review.restaurant, review.rating, 1, session);

        // update visitHistory to reviewed
        await VisitHistory.updateOne(
            {
                customer: user.profile,
                restaurant: data.restaurant,
                'visits.visitDate': visitDate
            },
            {
                $set: { 'visits.$.reviewed': true }
            }
        ).session(session);

        // add points to customer
        await adjustPoints(50, restaurant._id, user.profile, session);

        const returnedReview = {
            ...review.toObject(),
            username: user.username
        };

        return success(returnedReview);
    });
}

export async function createReply(data, review, authUser) {
    // add reply to review
    review.reply = {
        owner: authUser.profile,
        replyText: data.replyText
    };
    await review.save();
    const returnedReview = {
        ...review.toObject(),
        username: authUser.username
    };

    return success(returnedReview);
}

export async function addBadge(data, reviewId, authUser) {
    return await withTransaction(async (session) => {
        // find review
        const review = await Review.findById(reviewId).session(session).lean();
        if (!review) return error(404, 'Review with this ID not found');

        // check if customer has made a badgeVote for this review
        const badgeVote = await ReviewBadgeVote.findOne({
            customer: authUser.profile,
            review: review._id
        }).session(session);

        // if it exists, change the vote
        if (badgeVote) {
            badgeVote.badgeIndex = data.badgeIndex;
            await badgeVote.save(wrapSession(session));
        } else {
            const newBadgeVote = new ReviewBadgeVote({
                customer: authUser.profile,
                review: review._id,
                restaurant: review.restaurant,
                badgeIndex: data.badgeIndex
            });
            await newBadgeVote.save(wrapSession(session));

            await adjustPoints(2, review.restaurant, review.customer, session);
        }

        return success(data.badgeIndex);
    });
}

export async function deleteReview(review) {
    return await withTransaction(async (session) => {
        // delete the review and associations
        await deleteReviewAndAssociations(review, session);

        return success(review.toObject());
    });
}

export async function deleteReply(review) {
    // delete reply
    review.reply = undefined;
    await review.save();

    return success(review.toObject());
}

export async function deleteBadge(reviewId, authUser) {
    return await withTransaction(async (session) => {
        // find review
        const review = await Review.findById(reviewId).session(session).lean();
        if (!review) return error(404, 'Review with this ID not found');

        // find badgeVote
        const badgeVote = await ReviewBadgeVote.findOne({
            customer: authUser.profile,
            review: review._id
        }).session(session);
        if (!badgeVote) return error(404, 'Vote does not exist');
        const badgeIndex = badgeVote.badgeIndex;
        await badgeVote.deleteOne(wrapSession(session));
        await adjustPoints(-2, review.restaurant, review.customer, session); // deducts if the reviewer has enough points

        return success(badgeIndex);
    });
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
        updateRatingForRestaurant(review.restaurant, -1 * review.rating, -1, session),
        updateVisitReviewedStatus(review.customer, review.restaurant, review.dateVisited, false, session)
    ]);

    // delete review after children deleted
    await Review.deleteOne({ _id: review._id }).session(session);
}