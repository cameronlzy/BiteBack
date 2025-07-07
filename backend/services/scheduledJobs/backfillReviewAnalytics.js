import { DateTime } from 'luxon';
import mongoose from 'mongoose';
import Review from '../../models/review.model.js';
import DailyAnalytics from '../../models/dailyAnalytics.model.js';

export async function backfillReviewAnalytics(startOfDay) {
    const todayUTC = startOfDay.toUTC().toJSDate();
    const tomorrowUTC = startOfDay.plus({ days: 1 }).toUTC().toJSDate();

    const reviewsCreatedToday = await Review.find({
        createdAt: { $gte: todayUTC, $lt: tomorrowUTC }
    })
    .select('restaurant dateVisited')
    .populate('restaurant', 'timezone')
    .lean();

    const uniquePairs = new Map();

    for (const review of reviewsCreatedToday) {
        if (!review.dateVisited || !review.restaurant) continue;

        const dateStr = DateTime.fromJSDate(review.dateVisited).toISODate();
        const restId  = review.restaurant._id.toString();
        const key     = `${restId}|${dateStr}`;

        if (!uniquePairs.has(key)) {
            uniquePairs.set(key, { 
                id: restId,
                timezone: review.restaurant.timezone,
                dateStr 
            });
        }
    }

    const computeReviewAnalytics = (reviewStats) => {
        let reviewCount = 0;
        let totalStars = 0;
        let modeRating = null;
        let maxCount = 0;

        for (const { _id: rating, count } of reviewStats) {
            reviewCount += count;
            totalStars += rating * count;
            if (count > maxCount) {
                maxCount = count;
                modeRating = rating;
            }
        }

        return {
            count: reviewCount,
            averageRating: reviewCount ? totalStars / reviewCount : 0,
            ratingMode: modeRating
        };
    };

    for (const { id: restId, timezone, dateStr } of uniquePairs.values()) {
        const dayStartUTC = DateTime.fromISO(dateStr, { zone: timezone }).startOf('day').toUTC().toJSDate();
        const dayEndUTC = DateTime.fromISO(dateStr, { zone: timezone }).endOf('day').toUTC().toJSDate();

        // aggregate review stats for this day & restaurant
        const reviewStats = await Review.aggregate([
            {
                $match: {
                    restaurant: new mongoose.Types.ObjectId(restId),
                    dateVisited: { $gte: dayStartUTC, $lte: dayEndUTC }
                }
            },
            {
                $group: {
                    _id: '$rating',
                    count: { $sum: 1 }
                }
            }
        ]);

        const reviewAnalytics = computeReviewAnalytics(reviewStats);

        await DailyAnalytics.updateOne(
            { restaurant: restId, date: dayStartUTC },
            { $set: { reviews: reviewAnalytics } },
            { upsert: true }
        );
    }
}
