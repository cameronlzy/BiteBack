import { DateTime } from 'luxon';
import Review from '../../models/review.model.js';
import DailyAnalytics from '../../models/dailyAnalytics.model.js';

export async function backfillReviewAnalytics(daySGT) {
    const todayUTC = daySGT.toUTC().toJSDate();
    const tomorrowUTC = daySGT.toUTC().toJSDate();

    const reviewsCreatedToday = await Review.find({
        createdAt: { $gte: todayUTC, $lt: tomorrowUTC }
    })
    .select('restaurant dateVisited')
    .lean();

    const uniquePairs = new Map();

    for (const review of reviewsCreatedToday) {
        if (!review.dateVisited || !review.restaurant) continue;

        const dateStr = DateTime.fromJSDate(review.dateVisited).toISODate();
        const key = `${review.restaurant.toString()}|${dateStr}`;

        if (!uniquePairs.has(key)) {
            uniquePairs.set(key, { restaurant: review.restaurant, dateStr });
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

    for (const { restaurant, dateStr } of uniquePairs.values()) {
        const dayStartSGT = DateTime.fromISO(dateStr, { zone: 'Asia/Singapore' }).startOf('day');
        const dayEndSGT = dayStartSGT.endOf('day');
        const dayStartUTC = dayStartSGT.toUTC().toJSDate();
        const dayEndUTC = dayEndSGT.toUTC().toJSDate();

        // Aggregate review stats for this day & restaurant
        const reviewStats = await Review.aggregate([
            {
                $match: {
                    restaurant,
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
            { restaurant, date: dayStartUTC },
            { $set: { reviews: reviewAnalytics } },
            { upsert: true }
        );
    }
}
