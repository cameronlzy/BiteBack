import mongoose from 'mongoose';
import request from 'supertest';
import { DateTime } from 'luxon';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { createTestPromotion } from '../../factories/promotion.factory.js';
import { serverPromise } from '../../../index.js';
import { generateAuthToken } from '../../../helpers/token.helper.js';
import { setTokenCookie } from '../../../helpers/cookie.helper.js';
import { createTestUser } from '../../factories/user.factory.js';
import { createTestRestaurant } from '../../factories/restaurant.factory.js';
import User from '../../../models/user.model.js';
import Promotion from '../../../models/promotion.model.js';
import Restaurant from '../../../models/restaurant.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('promotion test', () => {
    let server;

    beforeAll(async () => {
        server = await serverPromise;
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await server.close();
    });

    describe('GET /api/promotions', () => {
        let titles;
        let descriptions;
        let restaurants;
        let promotion;
        let endDates;
        let url;

        beforeEach(async () => {
            await Promotion.deleteMany({});

            // create 2 titles
            titles = ['Alpha', 'Zebra'];

            // create 2 ratings
            descriptions = ['Buy one get one free', 'Half off second purchase'];

            // create 2 restaurant id
            restaurants = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];

            // create 2 endDates
            endDates = [
                DateTime.now().plus({ weeks: 1}).toJSDate(), 
                DateTime.now().plus({ weeks: 2 }).toJSDate()
            ];

            // create 2 promotions
            for (let i = 0; i < 2; i++) {
                promotion = createTestPromotion(restaurants[i]);
                promotion.title = titles[i];
                promotion.description = descriptions[i];
                promotion.endDate = endDates[i];
                await promotion.save();
            }
            url = '/api/promotions';
        });

        const exec = () => {
            return request(server)
            .get(url);
        };

        it('should return an array of promotion', async () => {
        const res = await exec();
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.promotions)).toBe(true);
            expect(res.body.promotions.length).toBe(2);

            res.body.promotions.forEach((promotion) => {
                expect(promotion).toHaveProperty('title');
                expect(promotion).toHaveProperty('description');
                expect(promotion).toHaveProperty('startDate');
                expect(promotion).toHaveProperty('endDate');
            });
        });
    
        it('should sort by title ascending', async () => {
            url = '/api/promotions?sortBy=title&order=asc';
            const res = await exec();

            const titlesSorted = [...titles].sort();
            expect(res.body.promotions.map(r => r.title)).toEqual(titlesSorted);
        });

        it('should sort by title descending', async () => {
            url = '/api/promotions?sortBy=title&order=desc';
            const res = await exec();

            const titlesSorted = [...titles].sort().reverse();
            expect(res.body.promotions.map(r => r.title)).toEqual(titlesSorted);
        });

        it('should sort by endDate descending', async () => {
            url = '/api/promotions?sortBy=endDate&order=desc';
            const res = await exec();

            const responseDates = res.body.promotions.map(r => new Date(r.endDate).toISOString());
            const expectedDates = [...endDates].sort((a,b) => b - a).map(d => d.toISOString());

            expect(responseDates).toEqual(expectedDates);
        });

        it('should return only promotions matching search query', async () => {
            url = '/api/promotions?search=Zebra';
            const res = await exec();

            expect(res.body.promotions.length).toBe(1);
            expect(res.body.promotions[0].title).toBe('Zebra');
        });

        it('should return only promotions from restaurant', async () => {
            url = `/api/promotions?restaurants=${restaurants[0].toString()}`;
            const res = await exec();

            expect(res.body.promotions.length).toBe(1);
            expect(res.body.promotions[0].title).toBe('Alpha');
        });
    });

    describe('GET /api/promotions/:id', () => {
        let promotion, promotionId;

        beforeEach(async () => {
            await Promotion.deleteMany({});

            promotion = createTestPromotion();
            await promotion.save();
            promotionId = promotion._id;
        });

        const exec = () => {
            return request(server)
            .get(`/api/promotions/${promotionId}`);
        };

        it('should return 400 if invalid id', async () => {
            promotionId = 1;
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 200 and promotion object with required properties', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = [
                'title', 'description', 'startDate', 'endDate'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    describe('POST /api/promotions', () => {
        let user, token, cookie;
        let restaurant, title, description, startDate, endDate;

        beforeEach(async () => {
            await Promotion.deleteMany({});
            await User.deleteMany({});

            // create owner
            user = await createTestUser('owner');
            await user.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            // create promotion
            restaurant = new mongoose.Types.ObjectId();
            title = 'title';
            description = 'description';
            startDate = DateTime.now().plus({ days: 1 }).toJSDate();
            endDate = DateTime.now().plus({ weeks: 1 }).toJSDate();            
        });

        const exec = () => {
            return request(server)
            .post('/api/promotions')
            .set('Cookie', [cookie])
            .send({
                restaurant, title, description, startDate, endDate
            });
        };

        it('should return 401 if no token', async () => {
            cookie = '';
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 401 if invalid token', async () => {
            cookie = setTokenCookie('invalid-token');
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 403 if customer', async () => {
            let customer = await createTestUser('customer');
            token = generateAuthToken(customer);
            cookie = setTokenCookie(token);
            const res = await exec();
            expect(res.status).toBe(403);
        });

        it('should return 400 if invalid request', async () => {
            startDate = '';
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should return 200 and promotion object with required properties', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = [
                'restaurant', 'title', 'description', 'startDate', 'endDate'
            ];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
        
    });

    describe('POST /api/promotions/:id/images', () => {
        let user, token, cookie;
        let promotion, promotionId;
        let filePath;
        let restaurant;

        beforeEach(async () => {
            await Promotion.deleteMany({});
            await User.deleteMany({});
            await Restaurant.deleteMany({});

            // create owner
            user = await createTestUser('owner');
            await user.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            // create restaurant
            restaurant = createTestRestaurant(user._id);
            await restaurant.save();

            // create promotion
            promotion = createTestPromotion(restaurant._id);
            await promotion.save();
            promotionId = promotion._id;

            // image file path
            filePath = path.join(__dirname, '../../fixtures/test-image.jpg');
        });

        const exec = () => {
            return request(server)
            .post(`/api/promotions/${promotionId}/images`)
            .set('Cookie', [cookie])
            .attach('mainImage', filePath)
            .attach('bannerImage', filePath);
        };

        it('should return 401 if no token', async () => {
            cookie = '';
            const res = await request(server)
                .post(`/api/promotions/${promotionId}/images`)
                .set('Cookie', [cookie]);
            expect(res.status).toBe(401);
        });

        it('should return 401 if invalid token', async () => {
            cookie = setTokenCookie('invalid-token');
            const res = await request(server)
                .post(`/api/promotions/${promotionId}/images`)
                .set('Cookie', [cookie]);
            expect(res.status).toBe(401);
        });

        it('should return 400 if invalid id', async () => {
            promotionId = 1;
            const res = await request(server)
                .post(`/api/promotions/${promotionId}/images`)
                .set('Cookie', [cookie]);
            expect(res.status).toBe(400);
        });

        it('should return 404 if promotion not found', async () => {
            promotionId = new mongoose.Types.ObjectId();
            const res = await request(server)
                .post(`/api/promotions/${promotionId}/images`)
                .set('Cookie', [cookie]);
            expect(res.status).toBe(404);
        });

        it('should return 403 if promotion does not belong to user', async () => {
            let otherUser = await createTestUser('owner');
            token = generateAuthToken(otherUser);
            cookie = setTokenCookie(token);
            const res = await request(server)
                .post(`/api/promotions/${promotionId}/images`)
                .set('Cookie', [cookie]);
            expect(res.status).toBe(403);
        });

        // skip to avoid sending test images to cloudinary
        it.skip('should return 200 if valid request', async () => { 
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('mainImage');
            expect(res.body).toHaveProperty('bannerImage');

            expect(typeof res.body.mainImage).toBe('string');
            expect(typeof res.body.bannerImage).toBe('string');

            const urlRegex = /^https?:\/\/.+|^\/.+/;
            expect(res.body.mainImage).toMatch(urlRegex);
            expect(res.body.bannerImage).toMatch(urlRegex);
        });
    });

    describe('PATCH /api/promotions/:id/images', () => {
        let user, token, cookie;
        let promotion, promotionId;
        let filePath;
        let restaurant;

        beforeEach(async () => {
            await Promotion.deleteMany({});
            await User.deleteMany({});
            await Restaurant.deleteMany({});

            // create owner
            user = await createTestUser('owner');
            await user.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            // create restaurant
            restaurant = createTestRestaurant(user._id);
            await restaurant.save();

            // create promotion
            promotion = createTestPromotion(restaurant._id);
            await promotion.save();
            promotionId = promotion._id;

            // image file path
            filePath = path.join(__dirname, '../../fixtures/test-image.jpg');
        });

        const exec = () => {
            return request(server)
            .patch(`/api/promotions/${promotionId}/images`)
            .set('Cookie', [cookie])
            .attach('mainImage', filePath)
        };

        it('should return 401 if no token', async () => {
            cookie = '';
            const res = await request(server)
                .patch(`/api/promotions/${promotionId}/images`)
                .set('Cookie', [cookie]);
            expect(res.status).toBe(401);
        });

        it('should return 401 if invalid token', async () => {
            cookie = setTokenCookie('invalid-token');
            const res = await request(server)
                .patch(`/api/promotions/${promotionId}/images`)
                .set('Cookie', [cookie]);
            expect(res.status).toBe(401);
        });

        it('should return 400 if invalid id', async () => {
            promotionId = 1;
            const res = await request(server)
                .patch(`/api/promotions/${promotionId}/images`)
                .set('Cookie', [cookie]);
            expect(res.status).toBe(400);
        });

        it('should return 404 if promotion not found', async () => {
            promotionId = new mongoose.Types.ObjectId();
            const res = await request(server)
                .patch(`/api/promotions/${promotionId}/images`)
                .set('Cookie', [cookie]);
            expect(res.status).toBe(404);
        });

        it('should return 403 if promotion does not belong to user', async () => {
            let otherUser = await createTestUser('owner');
            token = generateAuthToken(otherUser);
            cookie = setTokenCookie(token);
            const res = await request(server)
                .patch(`/api/promotions/${promotionId}/images`)
                .set('Cookie', [cookie]);
            expect(res.status).toBe(403);
        });

        it('should return 400 if no images attached', async () => {
            const res = await request(server)
                .patch(`/api/promotions/${promotionId}/images`)
                .set('Cookie', [cookie]);
            expect(res.status).toBe(400);
        });

        // skip to avoid sending test images to cloudinary
        it.skip('should return 200 if valid request', async () => { 
            const res = await exec();
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('mainImage');

            expect(typeof res.body.mainImage).toBe('string');

            const urlRegex = /^https?:\/\/.+|^\/.+/;
            expect(res.body.mainImage).toMatch(urlRegex);
        });
    });
});