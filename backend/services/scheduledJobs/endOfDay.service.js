import { DateTime } from 'luxon';
import mongoose from 'mongoose';
import Review from '../../models/review.model.js';
import DailyAnalytics from '../../models/dailyAnalytics.model.js';
import Restaurant from '../../models/restaurant.model.js';
import Reservation from '../../models/reservation.model.js';
import QueueEntry from '../../models/queueEntry.model.js';
import QueueCounter from '../../models/queueCounter.model.js';
import { getOpeningHoursToday } from '../../helpers/restaurant.helper.js';

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
        const restId = review.restaurant._id.toString();
        const key = `${restId}|${dateStr}`;

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

export async function processEndOfDay(nowSGT) {
    const nowTotalMinutes = nowSGT.hour * 60 + nowSGT.minute;

    const restaurants = await Restaurant.find();

    for (const restaurant of restaurants) {
        const dayHours = getOpeningHoursToday(restaurant);
        if (!dayHours || dayHours === 'x') continue;

        const [openStr, closeStr] = dayHours.split('-');    
        
        const [openHourStr, openMinuteStr] = openStr.split(':');
        const openHour = parseInt(openHourStr, 10);
        const openMinute = parseInt(openMinuteStr, 10);
        let openTotalMinutesUTC = openHour * 60 + openMinute;

        const [closeHourStr, closeMinuteStr] = closeStr.split(':');
        const closeHour = parseInt(closeHourStr, 10);
        const closeMinute = parseInt(closeMinuteStr, 10);
        let closeTotalMinutesUTC = closeHour * 60 + closeMinute;

        let openTotalMinutesSGT = (openTotalMinutesUTC + 8 * 60) % 1440;
        let closeTotalMinutesSGT = (closeTotalMinutesUTC + 8 * 60) % 1440;

        const isAfterOpen = nowTotalMinutes >= openTotalMinutesSGT;
        const isAfterClose = nowTotalMinutes >= closeTotalMinutesSGT || closeTotalMinutesSGT < openTotalMinutesSGT;

        if (isAfterClose && isAfterOpen) {
            const todaySGT = nowSGT.startOf('day');
            const todayUTC = todaySGT.toUTC().toJSDate();
            const session = await mongoose.startSession();

            await session.withTransaction(async () => {
                const existing = await DailyAnalytics.findOne({
                    restaurant: restaurant._id,
                    date: todayUTC
                }).session(session);

                if (existing) return;

                // analytics processing
                const analyticsData = await generateAnalytics(restaurant, session);

                // clears queue
                await queueCleanup(restaurant, session);

                // clears reservations
                await cleanupPastReservations(restaurant, session);

                // save doc
                await DailyAnalytics.create([analyticsData], { session });
            });
        }
    }
}

export async function cleanupPastReservations(restaurant, session) {
    const now = DateTime.now().setZone(restaurant.timezone);
    const nowUTC = now.toUTC().toJSDate();

    await Reservation.deleteMany({
        restaurant: restaurant._id,
        startDate: { $lt: nowUTC }
    }).session(session);
}

export async function generateAnalytics(restaurant, session) {
    const today = DateTime.now().setZone(restaurant.timezone).startOf('day');
    const tomorrow = today.plus({ days: 1 });
    const todayUTC = today.toUTC().toJSDate();
    const tomorrowUTC = tomorrow.toUTC().toJSDate();
    const restaurantId = restaurant._id;

    // reservations
    const reservationStats = await Reservation.aggregate([
        {
        $match: {
                restaurant: restaurantId,
                startDate: { $gte: todayUTC, $lt: tomorrowUTC }
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

    const r = reservationStats[0] ?? {};
    const reservationAnalytics = {
        total: r.total ?? 0,
        attended: r.attended ?? 0,
        noShowRate:
            r.total && r.attended !== undefined
                ? +((r.total - r.attended) / r.total).toFixed(3)
                : 0,
        averagePax: +(r.averagePax ?? 0).toFixed(1)
    };

    // queue
    const queueGroups = ['small', 'medium', 'large'];

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
                },
                isAttended: { $cond: [{ $eq: ['$status', 'seated'] }, 1, 0] }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                attended: { $sum: '$isAttended' },
                averageWaitTime: { $avg: '$waitTime' },
                ...Object.fromEntries(queueGroups.flatMap(group => [
                    [`${group}Total`, {
                        $sum: { $cond: [{ $eq: ['$queueGroup', group] }, 1, 0] }
                    }],
                    [`${group}Attended`, {
                        $sum: {
                            $cond: [{ $eq: ['$queueGroup', group] }, '$isAttended', 0]
                        }
                    }]
                ]))
            }
        },
        {
            $addFields: {
                abandonmentRate: {
                    $cond: [
                        { $gt: ['$total', 0] },
                        { $divide: [{ $subtract: ['$total', '$attended'] }, '$total'] },
                        0
                    ]
                }
            }
        }
    ]).session(session);

    const q = queueStats[0] ?? {};
    const queueAnalytics = {
        total: q.total ?? 0,
        attended: q.attended ?? 0,
        abandonmentRate: +(q.abandonmentRate ?? 0).toFixed(3),
        averageWaitTime: +(q.averageWaitTime ?? 0).toFixed(1),
        byQueueGroup: Object.fromEntries(
            queueGroups.map(group => [
                group,
                {
                    total: q[`${group}Total`] ?? 0,
                    attended: q[`${group}Attended`] ?? 0
                }
            ])
        )
    };

    const totalVisits = (r.attended ?? 0) + (q.attended ?? 0);

    // calculating visitLoadByHour
    let visitLoadByHour = null;

    const hoursToday = getOpeningHoursToday(restaurant);
    if (hoursToday && hoursToday !== 'x') {
        const [openStr, closeStr] = hoursToday.split('-');
        const [oh, _om] = openStr.split(':').map(Number);
        const [ch, cm] = closeStr.split(':').map(Number);

        let span = ch - oh;
        if (cm > 0) span += 1;
        if (span <= 0) span += 24;

        const loadArray = Array(span).fill(0);

        const attendedReservations = await Reservation.find({
            restaurant: restaurantId,
            startDate: { $gte: todayUTC, $lt: tomorrowUTC },
            status: { $in: ['completed', 'event'] }
        }).select('startDate').session(session);

        const seatedQueues = await QueueEntry.find({
            restaurant: restaurantId,
            status: 'seated',
            'statusTimestamps.waiting': { $gte: todayUTC, $lt: tomorrowUTC }
        }).select('statusTimestamps.waiting').session(session);

        for (const res of attendedReservations) {
            let i = Math.abs(DateTime.fromJSDate(res.startDate, { zone: 'utc' }).hour - oh);
            if (i >= 0 && i < loadArray.length) loadArray[i]++;
        }

        for (const qe of seatedQueues) {
            let i = Math.abs(DateTime.fromJSDate(qe.statusTimestamps.waiting, { zone: 'utc' }).hour - oh);
            if (i >= 0 && i < loadArray.length) loadArray[i]++;
        }

        visitLoadByHour = {
            startHour: oh,
            load: loadArray
        };
    }

    return {
        restaurant: restaurantId,
        date: todayUTC,
        totalVisits,
        visitLoadByHour,
        reservations: reservationAnalytics,
        reviews: { count: 0, averageRating: 0, ratingMode: null },
        queue: queueAnalytics
    };
}

export async function queueCleanup(restaurant, session) {
    // delete queueEntries for this restaurant
    await QueueEntry.deleteMany(
        { restaurant: restaurant._id }  
    ).session(session);

    // reset counters
    await QueueCounter.updateMany(
        { restaurant: restaurant._id },
        { $set: { lastNumber: 0, calledNumber: 0 } }
    ).session(session);
}