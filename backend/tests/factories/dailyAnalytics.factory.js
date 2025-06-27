import DailyAnalytics from '../../models/dailyAnalytics.model';

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max, decimals = 2) {
    const factor = Math.pow(10, decimals);
    return Math.round((Math.random() * (max - min) + min) * factor) / factor;
}

export function createTestAnalytics(restaurantId, date) {
    const totalVisits = getRandomInt(20, 200);

    const reservationTotal = getRandomInt(10, 80);
    const reservationAttended = getRandomInt(0, reservationTotal);
    const averagePax = reservationAttended > 0 ? getRandomFloat(1, 4) : 0;
    const noShowRate = reservationTotal > 0 ? (reservationTotal - reservationAttended) / reservationTotal : 0;

    const reviewCount = getRandomInt(0, 30);
    const averageRating = reviewCount > 0 ? getRandomFloat(2, 5) : 0;
    const ratingMode = reviewCount > 0 ? getRandomInt(1, 5) : undefined;

    const queueTotal = getRandomInt(10, 100);
    const queueAttended = getRandomInt(0, queueTotal);
    const abandonmentRate = queueTotal > 0 ? (queueTotal - queueAttended) / queueTotal : 0;
    const averageWaitTime = queueAttended > 0 ? getRandomInt(2, 15) : 0;

    const queueSmallTotal = getRandomInt(0, 30);
    const queueSmallAttended = getRandomInt(0, queueSmallTotal);

    const queueMediumTotal = getRandomInt(0, 40);
    const queueMediumAttended = getRandomInt(0, queueMediumTotal);

    const queueLargeTotal = getRandomInt(0, 30);
    const queueLargeAttended = getRandomInt(0, queueLargeTotal);

    const visitLoadByHour = {
        startHour: 9,
        load: Array.from({ length: 12 }, () => getRandomInt(0, 10))
    };

    const analytics = new DailyAnalytics({
        restaurant: restaurantId,
        date,
        totalVisits,
        visitLoadByHour,
        reservations: {
            total: reservationTotal,
            attended: reservationAttended,
            noShowRate,
            averagePax,
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
            byQueueGroup: {
                small: {
                    total: queueSmallTotal,
                    attended: queueSmallAttended,
                },
                medium: {
                    total: queueMediumTotal,
                    attended: queueMediumAttended,
                },
                large: {
                    total: queueLargeTotal,
                    attended: queueLargeAttended,
                },
            },
        },
    });

    return analytics;
}