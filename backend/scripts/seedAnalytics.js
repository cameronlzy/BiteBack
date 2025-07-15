import mongoose from 'mongoose';
import config from 'config';
import { DateTime } from 'luxon';
import DailyAnalytics from '../models/dailyAnalytics.model.js';
import Restaurant from '../models/restaurant.model.js';
import Review from '../models/review.model.js';
import CustomerProfile from '../models/customerProfile.model.js';
import { getOpeningWindow } from '../helpers/restaurant.helper.js';

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function roundToDP(value, dp) {
    const factor = 10 ** dp;
    return Math.round(value * factor) / factor;
}

function smoothValue(prev, trend = 0, volatility = 0.1, min = 0, max = Infinity) {
    const randomNoise = 1 + (Math.random() - 0.5) * 2 * volatility;
    const value = prev * (1 + trend) * randomNoise;
    return Math.min(Math.max(value, min), max);
}

async function createReviewsForDay(restaurantId, date, customers, numReviews = getRandomInt(4, 10)) {
    const reviews = [];

    for (let i = 0; i < numReviews; i++) {
        const rating = getRandomInt(1, 5);
        const randomCustomerId = customers[Math.floor(Math.random() * customers.length)];
        const review = new Review({
            customer: randomCustomerId,
            restaurant: restaurantId,
            rating,
            dateVisited: date.toJSDate(),
            isVisible: true,
        });
        reviews.push(review);
    }

    await Review.insertMany(reviews);
    return reviews;
}

function generateTrendedAnalytics(restaurantId, date, prev, reviewStats, visitLoadByHour) {
    const reservationTotal = smoothValue(prev.reservations.total, 0.01, 0.1, 20, 50);
    const reservationAttended = smoothValue(prev.reservations.attended, 0.01, 0.1, 0, reservationTotal);
    const averagePax = reservationAttended > 0 ? smoothValue(prev.reservations.averagePax, 0, 0.05, 1, 6) : 0;
    const noShowRate = reservationTotal > 0 ? (reservationTotal - reservationAttended) / reservationTotal : 0;

    const queueTotal = smoothValue(prev.queue.total, 0.005, 0.1, 20, 60);
    const queueAttended = smoothValue(prev.queue.attended, 0.005, 0.1, 0, queueTotal);
    const abandonmentRate = queueTotal > 0 ? (queueTotal - queueAttended) / queueTotal : 0;
    const averageWaitTime = queueAttended > 0 ? smoothValue(prev.queue.averageWaitTime, 0, 0.1, 2, 20) : 0;

    const queueGroups = ['small', 'medium', 'large'];

    const rawSplits = [Math.random(), Math.random(), Math.random()];
    const totalSplit = rawSplits.reduce((a, b) => a + b, 0);
    const proportions = rawSplits.map(split => split / totalSplit);

    const groupTotals = proportions.map(p => Math.round(queueTotal * p));

    const discrepancy = queueTotal - groupTotals.reduce((a, b) => a + b, 0);
    groupTotals[0] += discrepancy;

    const byQueueGroup = {};
    for (let i = 0; i < queueGroups.length; i++) {
        const group = queueGroups[i];
        const total = groupTotals[i];
        const attended = smoothValue(
            prev.queue.byQueueGroup[group].attended,
            0, 0.2, 0, total
        );
        byQueueGroup[group] = { total, attended };
    }

    const totalVisits = visitLoadByHour.load.reduce((sum, x) => sum + x, 0);

    return new DailyAnalytics({
        restaurant: restaurantId,
        date,
        totalVisits,
        visitLoadByHour,
        reservations: {
            total: reservationTotal,
            attended: reservationAttended,
            averagePax,
            noShowRate,
        },
        reviews: reviewStats,
        queue: {
            total: queueTotal,
            attended: queueAttended,
            abandonmentRate,
            averageWaitTime,
            byQueueGroup,
        },
    });
}

async function seedAnalytics(days, restaurantIdArg, timezone) {
    await mongoose.connect(config.get('mongoURI'), {
        autoIndex: false,
    });

    const restaurant = await Restaurant.findById(restaurantIdArg).lean();
    if (!restaurant) throw new Error(`Restaurant with ID ${restaurantIdArg} not found.`);

    const customers = (await CustomerProfile.find().select('_id').lean()).map(c => c._id);

    const today = DateTime.utc().setZone(timezone).startOf('day').toUTC();
    const analyticsData = [];

    let prevEntry = {
        reservations: { total: 30, attended: 25, averagePax: 2.5 },
        queue: {
            total: 90,
            attended: 80,
            averageWaitTime: 8,
            byQueueGroup: {
                small: { total: 20, attended: 18 },
                medium: { total: 40, attended: 36 },
                large: { total: 30, attended: 26 },
            }
        },
    };

    for (let i = days - 1; i >= 0; i--) {
        const date = today.minus({ days: i });
        const window = getOpeningWindow(date, restaurant.openingHours);

        if (!window) continue;
        
        // create visit load
        const visitLoadByHour = {
            startHour: window.startHourUTC,
            load: Array.from({ length: window.spanHours }, () => getRandomInt(1, 10)),
        };
        const totalVisits = visitLoadByHour.load.reduce((sum, x) => sum + x, 0);

        // create mock reviews and get stats for those reviews
        const reviewsForDay = await createReviewsForDay(restaurant._id, date, customers);
        const reviewCount = reviewsForDay.length;
        const ratingSum = reviewsForDay.reduce((sum, r) => sum + r.rating, 0);
        const ratingFreq = [0, 0, 0, 0, 0];

        for (const r of reviewsForDay) {
            ratingFreq[r.rating - 1]++;
        }

        const ratingModeIndex = ratingFreq.indexOf(Math.max(...ratingFreq));
        const averageRating = reviewCount ? ratingSum / reviewCount : 0;
        const ratingMode = reviewCount ? ratingModeIndex + 1 : undefined;

        const raw = generateTrendedAnalytics(
            restaurant._id,
            date.toJSDate(),
            prevEntry,
            { count: reviewCount, averageRating, ratingMode },
            visitLoadByHour
        );

        prevEntry = {
            reservations: raw.reservations,
            queue: raw.queue,
        };

        const rounded = new DailyAnalytics({
            restaurant: raw.restaurant,
            date: raw.date,
            totalVisits,
            visitLoadByHour: {
                startHour: visitLoadByHour.startHour,
                load: visitLoadByHour.load.map(Math.round),
            },
            reservations: {
                total: Math.round(raw.reservations.total),
                attended: Math.round(raw.reservations.attended),
                noShowRate: roundToDP(raw.reservations.noShowRate, 1),
                averagePax: roundToDP(raw.reservations.averagePax, 1),
            },
            reviews: {
                count: Math.round(raw.reviews.count),
                averageRating: roundToDP(raw.reviews.averageRating, 2),
                ratingMode: raw.reviews.ratingMode,
            },
            queue: {
                total: Math.round(raw.queue.total),
                attended: Math.round(raw.queue.attended),
                abandonmentRate: roundToDP(raw.queue.abandonmentRate, 1),
                averageWaitTime: roundToDP(raw.queue.averageWaitTime, 1),
                byQueueGroup: {
                    small: {
                        total: Math.round(raw.queue.byQueueGroup.small.total),
                        attended: Math.round(raw.queue.byQueueGroup.small.attended),
                    },
                    medium: {
                        total: Math.round(raw.queue.byQueueGroup.medium.total),
                        attended: Math.round(raw.queue.byQueueGroup.medium.attended),
                    },
                    large: {
                        total: Math.round(raw.queue.byQueueGroup.large.total),
                        attended: Math.round(raw.queue.byQueueGroup.large.attended),
                    },
                },
            },
        });
        analyticsData.push(rounded);
    }

    await DailyAnalytics.insertMany(analyticsData);
    console.log(`${days} DailyAnalytics entries created.`);
    await mongoose.disconnect();
}

const daysArg = parseInt(process.argv[2], 10) || 180;
const restaurantIdArg = process.argv[3] || null;
const timezone = process.argv[4] || 'Asia/Singapore';

(async () => {
    try {
        await seedAnalytics(daysArg, restaurantIdArg, timezone);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
