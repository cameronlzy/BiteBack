import RewardItem from '../../../models/rewardItem.model.js';
import { createTestUser } from '../../factories/user.factory.js';
import { createTestRestaurant } from '../../factories/restaurant.factory.js';
import { createTestRewardItem } from '../../factories/rewardItem.factory.js';
import { generateAuthToken } from '../../../helpers/token.helper.js';
import { setTokenCookie } from '../../../helpers/cookie.helper.js';
import { serverPromise } from '../../../index.js';
import request from 'supertest';
import mongoose from 'mongoose';
import Restaurant from '../../../models/restaurant.model.js';
import { it } from '@jest/globals';
import User from '../../../models/user.model.js';

describe('rewards shop test', () => {
    let server;
    beforeAll(async () => {
        server = await serverPromise;
    });

    afterAll(async () => {
        await mongoose.connection.close();
        await server.close();
    });

    describe('GET /api/rewards/restaurant/:id/shop', () => {
        let rewardItem;
        let restaurantId;

        beforeEach(async () => {
            await RewardItem.deleteMany({});
            await Restaurant.deleteMany({});

            restaurantId = new mongoose.Types.ObjectId();
            rewardItem = createTestRewardItem(restaurantId);
            await rewardItem.save();
            rewardItem = createTestRewardItem(restaurantId);
            await rewardItem.save();
        });

        const exec = () => {
            return request(server)
                .get(`/api/rewards/restaurant/${restaurantId}/shop`);
        };
        
        it('should return 200 and all reward items', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            res.body.items.forEach(item => {    
                const requiredKeys = ['category', 'description', 'pointsRequired', 'isActive'];
                expect(Object.keys(item)).toEqual(expect.arrayContaining(requiredKeys));
            });
        });
    });

    describe('GET /api/rewards/shop/:itemId', () => {
        let rewardItem, rewardItemId;

        beforeEach(async () => {
            await RewardItem.deleteMany({});

            rewardItem = createTestRewardItem();
            await rewardItem.save();
            rewardItemId = rewardItem._id;
        });

        const exec = () => {
            return request(server)
                .get(`/api/rewards/shop/${rewardItemId}`);
        };
        
        it('should return 200 and reward item', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = ['category', 'description', 'pointsRequired', 'isActive'];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    describe('POST /api/rewards/restaurant/:id/shop', () => {
        let user, token, cookie;
        let restaurant, restaurantId;
        let category, description, pointsRequired;

        beforeEach(async () => {
            await RewardItem.deleteMany({});
            await Restaurant.deleteMany({});
            await User.deleteMany({});

            category = 'percentage';
            description = 'description';
            pointsRequired = 100;

            user = await createTestUser('owner');
            await user.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            restaurant = createTestRestaurant(user._id);
            await restaurant.save();
            restaurantId = restaurant._id;
        });

        const exec = () => {
            return request(server)
                .post(`/api/rewards/restaurant/${restaurantId}/shop`)
                .set('Cookie', [cookie])
                .send({
                    category, description, pointsRequired
                });
        };
        
        it('should return 200 and new reward item', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = ['category', 'description', 'pointsRequired', 'isActive'];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
        });
    });

    describe('PATCH /api/rewards/restaurant/:id/shop/:itemId', () => {
        let rewardItem, rewardItemId;
        let restaurant, restaurantId;
        let user, token, cookie;

        beforeEach(async () => {
            await RewardItem.deleteMany({});
            await Restaurant.deleteMany({});
            await User.deleteMany({});

            user = await createTestUser('owner');
            await user.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            restaurant = createTestRestaurant(user._id);
            await restaurant.save();
            restaurantId = restaurant._id;

            rewardItem = createTestRewardItem(restaurant._id);
            await rewardItem.save();
            rewardItemId = rewardItem._id;
        });

        const exec = () => {
            return request(server)
                .patch(`/api/rewards/restaurant/${restaurantId}/shop/${rewardItemId}`)
                .set('Cookie', [cookie])
                .send({ pointsRequired: 10 });
        };
        
        it('should return 200 and reward item', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = ['category', 'description', 'pointsRequired', 'isActive'];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
            expect(res.body.pointsRequired).toBe(10);
        });
    });

    describe('DELETE /api/rewards/restaurant/:id/shop/:itemId', () => {
        let rewardItem, rewardItemId;
        let restaurant, restaurantId;
        let user, token, cookie;

        beforeEach(async () => {
            await RewardItem.deleteMany({});
            await Restaurant.deleteMany({});
            await User.deleteMany({});

            user = await createTestUser('owner');
            await user.save();
            token = generateAuthToken(user);
            cookie = setTokenCookie(token);

            restaurant = createTestRestaurant(user._id);
            await restaurant.save();
            restaurantId = restaurant._id;

            rewardItem = createTestRewardItem(restaurant._id);
            await rewardItem.save();
            rewardItemId = rewardItem._id;
        });

        const exec = () => {
            return request(server)
                .delete(`/api/rewards/restaurant/${restaurantId}/shop/${rewardItemId}`)
                .set('Cookie', [cookie]);
        };
        
        it('should return 200 and soft delete reward item', async () => {
            const res = await exec();
            expect(res.status).toBe(200);
            const requiredKeys = ['category', 'description', 'pointsRequired', 'isActive'];
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining(requiredKeys));
            expect(res.body.isDeleted).toBe(true);
            expect(res.body.isActive).toBe(false);
        });
    });
});