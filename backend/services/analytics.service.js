import DailyAnalytics from '../models/dailyAnalytics.model.js';
import QueueEntry from '../models/queueEntry.model.js';
import Reservation from '../models/reservation.model.js';
import { error, success } from '../helpers/response.js';
import { getOpeningHoursToday } from '../helpers/restaurant.helper.js';
import { groupVisitLoadByWeekdayPattern, computeMode, getPeriodFromLabel, getCurrentOpeningPattern, matchesCurrentHours } from '../helpers/analytics.helper.js';
import { DateTime } from 'luxon';
import _ from 'lodash';
import { getRedisClient } from '../startup/redisClient.js';

export async function getSnapshot(restaurant) {
    const openHour = getOpeningHoursToday(restaurant);
    if (openHour === 'x') return success(null);

    const now = DateTime.now().setZone(restaurant.timezone);
    const today = now.startOf('day');
    const tomorrow = today.plus({ days: 1 });
    const todayUTC = today.toUTC().toJSDate();
    const tomorrowUTC = tomorrow.toUTC().toJSDate();
    const nowUTC = now.toUTC();

    // look for existing entry
    const existing = await DailyAnalytics.findOne({
        restaurant: restaurant._id,
        date: todayUTC
    }).lean();

    if (existing) return success(_.pick(existing, ['reservations', 'queue']));

    // query data for snapshot
    const reservationStats = await Reservation.aggregate([
        {
            $match: {
                restaurant: restaurant._id,
                startDate: { $gte: todayUTC, $lt: tomorrowUTC }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                upcoming: {
                    $sum: {
                        $cond: [{ $gt: ['$startDate', nowUTC] }, 1, 0]
                    }
                }
            }
        }
    ]);

    const r = reservationStats[0] ?? {};
    const reservationAnalytics = {
        total: r.total ?? 0,
        upcoming: r.upcoming ?? 0
    };

    const oneHourAgoUTC = now.minus({ hours: 1 }).toUTC().toJSDate();
    const queueGroups = ['small', 'medium', 'large'];
    const queueStats = await QueueEntry.aggregate([
        {
            $match: {
                restaurant: restaurant._id,
                'statusTimestamps.waiting': { $gte: oneHourAgoUTC }
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
                attended: { $sum: '$isAttended' },
                averageWaitTime: { $avg: '$waitTime' },
                ...Object.fromEntries(queueGroups.flatMap(group => [
                    [`${group}Attended`, {
                        $sum: {
                            $cond: [{ $eq: ['$queueGroup', group] }, '$isAttended', 0]
                        }
                    }]
                ]))
            }
        }
    ]);

    const q = queueStats[0] ?? {};
    const queueAnalytics = {
        attended: q.attended ?? 0,
        averageWaitTime: +(q.averageWaitTime ?? 0).toFixed(1),
        byQueueGroup: Object.fromEntries(
            queueGroups.map(group => [
                group,
                {
                    attended: q[`${group}Attended`] ?? 0
                }
            ])
        )
    };

    return success({
        reservations: reservationAnalytics,
        queue: queueAnalytics,
    });
}

export async function getSummary(restaurant, query) {
    // either date or unit + amount
    const { unit, amount, date } = query;

    if (date) {
        const dateUTC = DateTime.fromISO(date, { zone: restaurant.timezone })
            .startOf('day')
            .toUTC()
            .toJSDate();
        const entry = await DailyAnalytics.findOne({
            restaurant: restaurant._id,
            date: dateUTC
        }).lean();
        return success({ type: 'single', date, aggregated: entry ?? null });
    }

    const now = DateTime.now().setZone(restaurant.timezone);
    const currentPattern = getCurrentOpeningPattern(restaurant);
    let start, end, groupFormat;

    if (unit === 'day') {
        end = now.startOf('day').minus({ days: 1 });
        start = end.minus({ days: amount - 2 });
        groupFormat = '%Y-%m-%d';
    } else if (unit === 'week') {
        end = now.endOf('week');
        start = now.startOf('week').minus({ weeks: amount - 1 });
        groupFormat = '%G-W%V';
    } else if (unit === 'month') {
        end = now.endOf('month');
        start = now.startOf('month').minus({ months: amount - 1 });
        groupFormat = '%Y-%m';
    } else {
        return error(400, 'Invalid unit. Use "day", "week", or "month"');
    }
    
    // aggregation
    const groupedDocs = await DailyAnalytics.aggregate([
        {
            $match: {
                restaurant: restaurant._id,
                date: {
                    $gte: start.toUTC().toJSDate(),
                    $lte: end.toUTC().toJSDate()
                }
            }
        },
        {
            $addFields: {
                group: {
                    $dateToString: {
                        date: '$date',
                        format: groupFormat,
                        timezone: restaurant.timezone
                    }
                }
            }
        },
        {
            $group: {
                _id: '$group',
                startDate: { $min: '$date' },
                endDate: { $max: '$date' },

                totalVisits: { $sum: '$totalVisits' },

                reservationTotal: { $sum: '$reservations.total' },
                reservationAttended: { $sum: '$reservations.attended' },
                totalPax: {
                    $sum: { $multiply: ['$reservations.attended', '$reservations.averagePax'] }
                },

                reviewCount: { $sum: '$reviews.count' },
                reviewRatingTotal: {
                    $sum: { $multiply: ['$reviews.count', '$reviews.averageRating'] }
                },
                allRatings: { $push: '$reviews.ratingMode' },

                queueTotal: { $sum: '$queue.total' },
                queueAttended: { $sum: '$queue.attended' },
                queueWaitTimeSum: { $sum: '$queue.averageWaitTime' },

                queueSmallTotal: { $sum: '$queue.byQueueGroup.small.total' },
                queueSmallAttended: { $sum: '$queue.byQueueGroup.small.attended' },
                queueMediumTotal: { $sum: '$queue.byQueueGroup.medium.total' },
                queueMediumAttended: { $sum: '$queue.byQueueGroup.medium.attended' },
                queueLargeTotal: { $sum: '$queue.byQueueGroup.large.total' },
                queueLargeAttended: { $sum: '$queue.byQueueGroup.large.attended' },

                daysCount: { $sum: 1 }
            }
        },
        { $sort: { startDate: 1 } }
    ]);

    const rawDocs = await DailyAnalytics.find({
        restaurant: restaurant._id,
        date: {
            $gte: start.toUTC().toJSDate(),
            $lte: end.toUTC().toJSDate()
        }
    }).select('date visitLoadByHour').lean();

    const visitLoadByGroup = new Map();

    if (unit === 'week' || unit === 'month') {
        for (const group of groupedDocs) {
            const from = DateTime.fromJSDate(group.startDate).startOf('day');
            const to = DateTime.fromJSDate(group.endDate).endOf('day');

            const docsInGroup = rawDocs.filter(doc => {
                const d = DateTime.fromJSDate(doc.date);
                return d >= from && d <= to && matchesCurrentHours(doc, currentPattern);
            });

            const grouped = groupVisitLoadByWeekdayPattern(docsInGroup);
            visitLoadByGroup.set(group._id, grouped);
        }
    }

    const entries = groupedDocs.map(doc => {
        const {
            _id,
            endDate,
            totalVisits,
            reservationTotal,
            reservationAttended,
            totalPax,
            reviewCount,
            reviewRatingTotal,
            queueTotal,
            queueAttended,
            queueWaitTimeSum,
            daysCount
        } = doc;

        const averagePax = reservationAttended > 0 ? totalPax / reservationAttended : 0;
        const averageRating = reviewCount > 0 ? reviewRatingTotal / reviewCount : 0;
        const noShowRate = reservationTotal > 0 ? (reservationTotal - reservationAttended) / reservationTotal : 0;
        const abandonmentRate = queueTotal > 0 ? (queueTotal - queueAttended) / queueTotal : 0;
        const averageWaitTime = daysCount > 0 ? queueWaitTimeSum / daysCount : 0;
        const ratingMode = computeMode(doc.allRatings.flat());

        const visitLoadByWeekday = visitLoadByGroup.get(_id) ?? undefined;

        const byQueueGroup = {
            small: {
                total: doc.queueSmallTotal,
                attended: doc.queueSmallAttended
            },
            medium: {
                total: doc.queueMediumTotal,
                attended: doc.queueMediumAttended
            },
            large: {
                total: doc.queueLargeTotal,
                attended: doc.queueLargeAttended
            }
        };

        return {
            label: _id,
            ...getPeriodFromLabel(_id, unit),
            isPartial: DateTime.fromJSDate(endDate) >= now.startOf(unit),
            aggregated: {
                totalVisits,
                reservations: {
                    total: reservationTotal,
                    attended: reservationAttended,
                    noShowRate,
                    averagePax
                },
                reviews: {
                    count: reviewCount,
                    averageRating,
                    ratingMode
                },
                queue: {
                    total: queueTotal,
                    attended: queueAttended,
                    abandonmentRate,
                    averageWaitTime,
                    byQueueGroup
                },
                ...(visitLoadByWeekday ? { visitLoadByWeekday } : {})
            }
        };
    });

    return success({
        type: 'range',
        unit,
        amount,
        startDate: start.toISODate(),
        endDate: end.toISODate(),
        dataPoints: entries.length,
        entries: entries.length > 0 ? entries : []
    });
}

export async function getTrends(restaurant, days) {
    const redisClient = await getRedisClient();
    const cacheKey = `analytics:trends:${restaurant._id}:days:${days}`;

    const cached = await redisClient.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }

    const now = DateTime.now().setZone(restaurant.timezone);
    const today = now.startOf('day');
    const todayUTC = today.toUTC();
    let end;
    const openHour = getOpeningHoursToday(restaurant);
    if (!openHour || openHour === 'x') {
        end = todayUTC;
    } else {
        const [_startTimeStr, endTimeStr] = openHour.split('-');
        const [endHour, endMinute] = endTimeStr.split(':').map(Number);
        const closeTimeUTC = todayUTC.set({ hour: endHour, minute: endMinute });
        end = now.toUTC() < closeTimeUTC ? todayUTC.minus({ days: 1 }) : todayUTC;
    }

    const start = end.minus({ days: days - 1 });

    const docs = await DailyAnalytics.find({
        restaurant: restaurant._id,
        date: {
            $gte: start.toJSDate(),
            $lte: end.toJSDate()
        }
    })
    .sort({ date: 1 })
    .lean();

    const response = success({
        days,
        startDate: start.toISODate(),
        endDate: end.toISODate(),
        entries: docs
    });

    await redisClient.set(cacheKey, JSON.stringify(response), { EX: 86400 });

    return response;
}