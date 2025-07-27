import { jest } from '@jest/globals';

await jest.unstable_mockModule('../../../startup/redisClient.js', async () => {
    const { getRedisClient } = await import('../../mocks/redisClientMock.js');
    return { getRedisClient };
});

const mongoose = (await import('mongoose')).default;
const request = (await import('supertest')).default;
const { DateTime } = await import('luxon');
const { serverPromise } = await import('../../../index.js');
const { generateAuthToken } = await import('../../../helpers/token.helper.js');
const { setTokenCookie } = await import('../../../helpers/cookie.helper.js');
const { createTestUser } = await import('../../factories/user.factory.js');
const { createTestRestaurant } = await import('../../factories/restaurant.factory.js');
const { createTestOwnerProfile } = await import('../../factories/ownerProfile.factory.js');
const { createTestAnalytics } = await import('../../factories/dailyAnalytics.factory.js');
const User = (await import('../../../models/user.model.js')).default;
const DailyAnalytics = (await import('../../../models/dailyAnalytics.model.js')).default;
const Restaurant = (await import('../../../models/restaurant.model.js')).default;
const OwnerProfile = (await import('../../../models/ownerProfile.model.js')).default;
const { convertOpeningHoursToUTC } = await import('../../../helpers/restaurant.helper.js');
const { getRedisClient } = await import('../../../startup/redisClient.js');

describe('analytics test', () => {
    let server;

    beforeAll(async () => {
        server = await serverPromise;
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await server.close();
    });

    describe('GET /api/analytics/restaurant/:id/snapshot', () => {
        let token, cookie;
        let restaurant, restaurantId;
        let user, profile;
        let analytics;

        beforeEach(async () => {
            await Restaurant.deleteMany({});
            await DailyAnalytics.deleteMany({});
            await User.deleteMany({});
            await OwnerProfile.deleteMany({});

            user = await createTestUser('owner');
            profile = createTestOwnerProfile(user._id);
            user.profile = profile._id;
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);
            await user.save();
            
            restaurant = createTestRestaurant(user.profile);
            restaurant.openingHours = convertOpeningHoursToUTC('09:00-19:00|09:00-19:00|09:00-19:00|09:00-19:00|09:00-19:00|09:00-19:00|09:00-19:00');
            profile.restaurants = [restaurant._id];

            await profile.save();
            await restaurant.save();
            restaurantId = restaurant._id;

            analytics = createTestAnalytics(restaurant._id, DateTime.utc().setZone('Asia/Singapore').startOf('day').toUTC());
            await analytics.save();
        });

        const exec = () => {
            return request(server)
            .get(`/api/analytics/restaurant/${restaurantId}/snapshot`)
            .set('Cookie', [cookie]);
        };

        it('should return 200 and a snapshot object', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = ['queue', 'reservations'];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    describe('GET /api/analytics/restaurant/:id/summary', () => {
        let token, cookie;
        let restaurant, restaurantId;
        let user, profile;
        let date, unit, amount;
        let url;

        beforeEach(async () => {
            await Restaurant.deleteMany({});
            await DailyAnalytics.deleteMany({});
            await User.deleteMany({});
            await OwnerProfile.deleteMany({});

            user = await createTestUser('owner');
            profile = createTestOwnerProfile(user._id);
            user.profile = profile._id;
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);
            await user.save();
            
            restaurant = createTestRestaurant(user.profile);
            profile.restaurants = [restaurant._id];

            await profile.save();
            await restaurant.save();
            restaurantId = restaurant._id;

            // create analytics using a loop
            const baseDate = DateTime.utc().setZone('Asia/Singapore').startOf('day').minus({ days: 13 });
            const analyticsDocs = [];

            for (let i = 0; i < 14; i++) {
                const date = baseDate.plus({ days: i }).toUTC().toJSDate();
                const analyticsEntry = createTestAnalytics(restaurant._id, date);
                analyticsDocs.push(analyticsEntry);
            }

            await DailyAnalytics.insertMany(analyticsDocs);
            date = encodeURIComponent(DateTime.utc().setZone('Asia/Singapore').startOf('day').minus({ days: 3 }).toISO());
            unit = 'week';
            amount = 3;
            url = `/api/analytics/restaurant/${restaurantId}/summary?unit=${unit}&amount=${amount}`;
        });

        const exec = () => {
            return request(server)
            .get(url)
            .set('Cookie', [cookie]);
        };

        it('should return 200 and a summary object for range query', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = ['type', 'unit', 'amount', 'startDate', 'endDate', 'dataPoints', 'entries'];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });

        it('should return 200 and a summary object for date query', async () => {
            url = `/api/analytics/restaurant/${restaurantId}/summary?date=${date}`;
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = ["type", "date", "aggregated"];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    describe('GET /api/analytics/restaurant/:id/trends', () => {
        let token, cookie;
        let restaurant, restaurantId;
        let user, profile;
        let days;
        let redisClient;

        beforeEach(async () => {
            await Restaurant.deleteMany({});
            await DailyAnalytics.deleteMany({});
            await User.deleteMany({});
            await OwnerProfile.deleteMany({});

            redisClient = await getRedisClient();
            await redisClient.flushall();

            user = await createTestUser('owner');
            profile = createTestOwnerProfile(user._id);
            user.profile = profile._id;
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);
            await user.save();
            
            restaurant = createTestRestaurant(user.profile);
            restaurant.openingHours = convertOpeningHoursToUTC('09:00-19:00|09:00-19:00|09:00-19:00|09:00-19:00|09:00-19:00|09:00-19:00|09:00-19:00');
            profile.restaurants = [restaurant._id];

            await profile.save();
            await restaurant.save();
            restaurantId = restaurant._id;

            // create analytics using a loop
            const baseDate = DateTime.utc().setZone('Asia/Singapore').startOf('day').minus({ days: 13 });
            const analyticsDocs = [];

            for (let i = 0; i < 14; i++) {
                const date = baseDate.plus({ days: i }).toUTC().toJSDate();
                const analyticsEntry = createTestAnalytics(restaurant._id, date);
                analyticsDocs.push(analyticsEntry);
            }

            await DailyAnalytics.insertMany(analyticsDocs);
            days = 7;
        });

        const exec = () => {
            return request(server)
            .get(`/api/analytics/restaurant/${restaurantId}/trends?days=${days}`)
            .set('Cookie', [cookie]);
        };

        it('should return 200 and a trend object', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = ['restaurant', 'date', 'totalVisits', 'reviews', 'queue', 'reservations'];
            res.body.entries.forEach(entry => {
                expect(Object.keys(entry)).toEqual(expect.arrayContaining(requiredKeys));
            });
        });

        it('should cache the analytics result in Redis after first request', async () => {
            const cacheKey = `analytics:trends:${restaurantId}:days:${days}`;
            await redisClient.del(cacheKey);

            const setSpy = jest.spyOn(redisClient, 'set');
            const getSpy = jest.spyOn(redisClient, 'get');

            const res1 = await exec();
            expect(res1.status).toBe(200);

            expect(setSpy).toHaveBeenCalledWith(
                cacheKey,
                expect.any(String),
                { EX: expect.any(Number) }
            );

            const res2 = await exec();
            expect(res2.status).toBe(200);
            expect(getSpy).toHaveBeenCalledWith(expect.stringContaining(cacheKey));

            setSpy.mockRestore();
            getSpy.mockRestore();
        });
    });
});