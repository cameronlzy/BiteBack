import mongoose from 'mongoose';
import request from 'supertest';
import { DateTime } from 'luxon';
import { serverPromise } from '../../../index.js';
import { generateAuthToken } from '../../../helpers/token.helper.js';
import { setTokenCookie } from '../../../helpers/cookie.helper.js';
import { createTestUser } from '../../factories/user.factory.js';
import { createTestRestaurant } from '../../factories/restaurant.factory.js';
import { createTestOwnerProfile } from '../../factories/ownerProfile.factory.js';
import { createTestAnalytics } from '../../factories/dailyAnalytics.factory.js';
import User from '../../../models/user.model.js';
import DailyAnalytics from '../../../models/dailyAnalytics.model.js';
import Restaurant from '../../../models/restaurant.model.js';
import OwnerProfile from '../../../models/ownerProfile.model.js';
import { convertOpeningHoursToUTC } from '../../../helpers/restaurant.helper.js';

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
            profile = createTestOwnerProfile(user);
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

            analytics = createTestAnalytics(restaurant._id, DateTime.now().setZone('Asia/Singapore').startOf('day').toUTC());
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
            profile = createTestOwnerProfile(user);
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
            const baseDate = DateTime.now().setZone('Asia/Singapore').startOf('day').minus({ days: 13 });
            const analyticsDocs = [];

            for (let i = 0; i < 14; i++) {
                const date = baseDate.plus({ days: i }).toUTC().toJSDate();
                const analyticsEntry = createTestAnalytics(restaurant._id, date);
                analyticsDocs.push(analyticsEntry);
            }

            await DailyAnalytics.insertMany(analyticsDocs);
            date = encodeURIComponent(DateTime.now().setZone('Asia/Singapore').startOf('day').minus({ days: 3 }).toISO());
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

        beforeEach(async () => {
            await Restaurant.deleteMany({});
            await DailyAnalytics.deleteMany({});
            await User.deleteMany({});
            await OwnerProfile.deleteMany({});

            user = await createTestUser('owner');
            profile = createTestOwnerProfile(user);
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
            const baseDate = DateTime.now().setZone('Asia/Singapore').startOf('day').minus({ days: 13 });
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
    });
});