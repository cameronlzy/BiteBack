import mongoose from 'mongoose';
import config from 'config';
import { DateTime } from 'luxon';
import DailyAnalytics from '../models/dailyAnalytics.model.js';
import Restaurant from '../models/restaurant.model.js';
import { getOpeningWindow } from '../helpers/restaurant.helper.js';

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function smoothValue(prev, trend = 0, volatility = 0.1, min = 0, max = Infinity) {
    const randomNoise = 1 + (Math.random() - 0.5) * 2 * volatility; // e.g., ±10%
    const value = prev * (1 + trend) * randomNoise;
    return Math.min(Math.max(value, min), max);
}

function generateTrendedAnalytics(restaurantId, date, prev) {
    const reservationTotal = smoothValue(prev.reservations.total, 0.01, 0.1, 10, 120);
    const reservationAttended = smoothValue(prev.reservations.attended, 0.01, 0.1, 0, reservationTotal);
    const averagePax = reservationAttended > 0 ? smoothValue(prev.reservations.averagePax, 0, 0.05, 1, 6) : 0;
    const noShowRate = reservationTotal > 0 ? (reservationTotal - reservationAttended) / reservationTotal : 0;

    const reviewCount = smoothValue(prev.reviews.count, 0, 0.2, 0, 50);
    const averageRating = reviewCount > 0 ? smoothValue(prev.reviews.averageRating, 0, 0.05, 2, 5) : 0;
    const ratingMode = reviewCount > 0 ? getRandomInt(1, 5) : undefined;

    const queueTotal = smoothValue(prev.queue.total, 0.005, 0.1, 20, 200);
    const queueAttended = smoothValue(prev.queue.attended, 0.005, 0.1, 0, queueTotal);
    const abandonmentRate = queueTotal > 0 ? (queueTotal - queueAttended) / queueTotal : 0;
    const averageWaitTime = queueAttended > 0 ? smoothValue(prev.queue.averageWaitTime, 0, 0.1, 2, 20) : 0;

    const queueGroups = ['small', 'medium', 'large'];
    const byQueueGroup = {};
    for (const group of queueGroups) {
        const total = smoothValue(prev.queue.byQueueGroup[group].total, 0, 0.2, 0, 60);
        const attended = smoothValue(prev.queue.byQueueGroup[group].attended, 0, 0.2, 0, total);
        byQueueGroup[group] = { total, attended };
    }

    const visitLoadByHour = {
        startHour: 9,
        load: prev.visitLoadByHour.load.map(load => Math.max(0, smoothValue(load, 0, 0.3, 0, 20)))
    };

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
        reviews: {
            count: reviewCount,
            averageRating,
            ratingMode,
        },
        queue: {
            total: queueTotal,
            attended: queueAttended,
            abandonmentRate,
            averageWaitTime,
            byQueueGroup,
        },
    });
}

async function seedAnalytics(days, restaurantIdArg) {
    await mongoose.connect(config.get('mongoURI'), {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        autoIndex: false,
    });

    const restaurant = await Restaurant.findById(restaurantIdArg);
    if (!restaurant) throw new Error(`Restaurant with ID ${restaurantIdArg} not found.`);

    const today = DateTime.now().setZone('Asia/Singapore').startOf('day').toUTC();
    const analyticsData = [];

    let prevEntry = {
        reservations: { total: 30, attended: 25, averagePax: 2.5 },
        reviews: { count: 10, averageRating: 4.0 },
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
        visitLoadByHour: {
            startHour: 9,
            load: Array.from({ length: 12 }, () => getRandomInt(1, 10))
        }
    };

    for (let i = days - 1; i >= 0; i--) {
        const date = today.minus({ days: i });
        const window = getOpeningWindow(date, restaurant.openingHours);

        if (!window) continue;

        const visitLoadByHour = {
            startHour: window.startHourUTC,
            load: Array.from({ length: window.spanHours }, () => getRandomInt(1, 10)),
        };

        const raw = generateTrendedAnalytics(restaurant._id, date, prevEntry);

        const rounded = new DailyAnalytics({
            restaurant: raw.restaurant,
            date: raw.date,
            totalVisits: Math.round(raw.totalVisits),
            visitLoadByHour: {
                startHour: visitLoadByHour.startHour,
                load: visitLoadByHour.load.map(Math.round),
            },
            reservations: {
                total: Math.round(raw.reservations.total),
                attended: Math.round(raw.reservations.attended),
                noShowRate: raw.reservations.noShowRate,
                averagePax: Math.round(raw.reservations.averagePax * 10) / 10,
            },
            reviews: {
                count: Math.round(raw.reviews.count),
                averageRating: Math.round(raw.reviews.averageRating * 10) / 10,
                ratingMode: raw.reviews.ratingMode,
            },
            queue: {
                total: Math.round(raw.queue.total),
                attended: Math.round(raw.queue.attended),
                abandonmentRate: raw.queue.abandonmentRate,
                averageWaitTime: Math.round(raw.queue.averageWaitTime),
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

(async () => {
    try {
        await seedAnalytics(daysArg, restaurantIdArg);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
