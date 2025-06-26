import DailyAnalytics from '../../models/dailyAnalytics.model.js';
import Reservation from '../../models/reservation.model.js';
import QueueEntry from '../../models/queueEntry.model.js';
import Review from '../../models/review.model.js';
import { DateTime } from 'luxon';
import { getOpeningHoursToday } from '../../helpers/restaurant.helper.js';

export async function generateAnalytics(restaurant, session) {
    const todaySGT = DateTime.now().setZone('Asia/Singapore').startOf('day');
    const tomorrowSGT = todaySGT.plus({ days: 1 });
    const todayUTC = todaySGT.toUTC().toJSDate();
    const tomorrowUTC = tomorrowSGT.toUTC().toJSDate();
    const restaurantId = restaurant._id;

    // reservations
    const reservationStats = await Reservation.aggregate([
        {
        $match: {
                restaurant: restaurantId,
                reservationDate: { $gte: todayUTC, $lt: tomorrowUTC }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                attended: {
                    $sum: { $cond: [{ $in: ['$status', ['completed', 'event']] }, 1, 0] }
                },
                averagePax: { $avg: '$pax' }
            }
        }
    ]).session(session);

    const r = reservationStats[0] || {};
    const reservationAnalytics = {
        total: r.total || 0,
        attended: r.attended || 0,
        noShowRate:
        r.total && r.attended !== undefined
            ? (r.total - r.attended) / r.total
            : 0,
        averagePax: r.averagePax || 0
    };

    // update past dailyAnalytics documents based on reviews created today
    let reviewAnalyticsToday;
    const reviewsCreatedToday = await Review.find({
        createdAt: { $gte: todayUTC },
        restaurant: restaurantId
    }).select('dateVisited').session(session).lean();

    const uniqueDateVisited = new Set();

    for (const review of reviewsCreatedToday) {
        if (!review.dateVisited) continue;
        const dateStr = DateTime.fromJSDate(review.dateVisited).toISODate();
        uniqueDateVisited.add(dateStr);
    }

    for (const dateStr of uniqueDateVisited) {
        const dayStartSGT = DateTime.fromISO(dateStr, { zone: 'Asia/Singapore' }).startOf('day');
        const dayEndSGT = dayStartSGT.endOf('day');
        const dayStartUTC = dayStartSGT.toUTC().toJSDate();
        const dayEndUTC = dayEndSGT.toUTC().toJSDate();

        const reviewStats = await Review.aggregate([
            {
                $match: {
                    restaurant: restaurantId,
                    dateVisited: { $gte: dayStartUTC, $lte: dayEndUTC }
                }
            },
            {
                $group: {
                    _id: '$rating',
                    count: { $sum: 1 }
                }
            }
        ]).session(session);

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

        const reviewAnalytics = {
            count: reviewCount,
            averageRating: reviewCount ? totalStars / reviewCount : 0,
            ratingMode: modeRating
        };

        if (dayStartSGT.equals(todaySGT)) {
            reviewAnalyticsToday = reviewAnalytics;
        } else {
            await DailyAnalytics.updateOne(
                {
                    restaurant: restaurantId,
                    date: dayStartUTC
                },
                {
                    $set: { reviews: reviewAnalytics }
                }
            ).session(session);
        }
    }

    // queue
    const queueStats = await QueueEntry.aggregate([
        {
            $match: {
                restaurant: restaurantId,
                'statusTimestamps.waiting': { $gte: todayUTC, $lt: tomorrowUTC }
            }
        },
        {
            $addFields: {
                waitTime: {
                    $cond: [
                        { $and: ['$statusTimestamps.seated', '$statusTimestamps.waiting'] },
                        { $divide: [{ $subtract: ['$statusTimestamps.seated', '$statusTimestamps.waiting'] }, 1000 * 60] }, // in minutes
                        null
                    ]
                }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                attended: {
                    $sum: { $cond: [{ $eq: ['$status', 'seated'] }, 1, 0] }
                },
                averageWaitTime: { $avg: '$waitTime' },
                small: {
                    $sum: { $cond: [{ $eq: ['$queueGroup', 'small'] }, 1, 0] }
                },
                medium: {
                    $sum: { $cond: [{ $eq: ['$queueGroup', 'medium'] }, 1, 0] }
                },
                large: {
                    $sum: { $cond: [{ $eq: ['$queueGroup', 'large'] }, 1, 0] }
                }
            }
        }
    ]).session(session);

    const q = queueStats[0] || {};
    const queueAnalytics = {
        total: q.total || 0,
        attended: q.attended || 0,
        averageWaitTime: q.averageWaitTime || 0,
        queueByQueueGroup: {
            small: q.small || 0,
            medium: q.medium || 0,
            large: q.large || 0
        }
    };

    const totalVisits = (r.attended || 0) + (q.attended || 0);

    // calculating visitLoadByHour
    let visitLoadByHour = null;

    const hoursToday = getOpeningHoursToday(restaurant);
    if (hoursToday && hoursToday !== 'x') {
        const [openStr, closeStr] = hoursToday.split('-');
        const openHour = parseInt(openStr.split(':')[0], 10);
        const closeHour = parseInt(closeStr.split(':')[0], 10);

        const hoursOpen = closeHour > openHour
            ? closeHour - openHour
            : 24 - openHour + closeHour;

        const loadArray = Array(hoursOpen).fill(0);

        const attendedReservations = await Reservation.find({
            restaurant: restaurantId,
            reservationDate: { $gte: todayUTC, $lt: tomorrowUTC },
            status: { $in: ['completed', 'event'] }
        }).select('reservationDate').session(session);

        const seatedQueues = await QueueEntry.find({
            restaurant: restaurantId,
            status: 'seated',
            'statusTimestamps.waiting': { $gte: todayUTC, $lt: tomorrowUTC }
        }).select('statusTimestamps.waiting').session(session);

        function getSGTHourIndex(date, openHour) {
            const hourSGT = DateTime.fromJSDate(date, { zone: 'Asia/Singapore' }).hour;
            return hourSGT >= openHour
                ? hourSGT - openHour
                : 24 - openHour + hourSGT;
        }

        for (const res of attendedReservations) {
            const i = getSGTHourIndex(res.reservationDate, openHour);
            if (i >= 0 && i < loadArray.length) loadArray[i]++;
        }

        for (const qe of seatedQueues) {
            const i = getSGTHourIndex(qe.statusTimestamps.waiting, openHour);
            if (i >= 0 && i < loadArray.length) loadArray[i]++;
        }

        visitLoadByHour = {
            startHour: openHour,
            load: loadArray
        };
    }

    return {
        restaurant: restaurantId,
        date: todayUTC,
        totalVisits,
        visitLoadByHour,
        reservations: reservationAnalytics || { count: 0, averageRating: 0, ratingMode: null },
        reviews: reviewAnalyticsToday,
        queue: queueAnalytics
    };
}
